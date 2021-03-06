import { AnimatePresence, motion } from "framer-motion";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { deleteSession, getAllGroupNames, getAllSessions, saveSession, SessionInfo } from "../../sessions";
import ModalComponent from "../ModalComponent/ModalComponent";
import SearchDropDown from "../SearchDropDown/SearchDropDown";
import SessionForm from "../SessionForm/SessionForm";
import './SessionSearchPage.css';

enum ModalState {
  NOT_SHOWING, CONFIRM_DELETE, CONFIRM_SAVE, CONFIRM_BACK
}

const CONFIRM_MODAL_PROMPTS = new Map([
  [ModalState.CONFIRM_DELETE, 'Delete this session?'],
  [ModalState.CONFIRM_SAVE, 'Overwrite this session?'],
  [ModalState.CONFIRM_BACK, 'Disregard current changes?'],
]);

enum SortState {
  NEUTRAL, INCREASING, DECREASING
}

const getNextSortState = (sortState: SortState): SortState => {
  switch (sortState) {
    case SortState.NEUTRAL:
      return SortState.INCREASING;
    case SortState.INCREASING:
      return SortState.DECREASING;
    case SortState.DECREASING:
      return SortState.NEUTRAL;
    default:
      return SortState.NEUTRAL;
  }
};

// const SORT_IMAGES = new Map([
//   [SortState.NEUTRAL, ]
// ])

const SORT_CHARS = new Map<SortState, string>([
  [SortState.NEUTRAL, '-'],
  [SortState.INCREASING, '\u25b2'],
  [SortState.DECREASING, '\u25bc'],
]);

const SessionSearchPage = () => {
  const [sessions, setSessions] = useState(getAllSessions());
  const [groupNameFilter, setGroupNameFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allGroupNames, setAllGroupNames] = useState<string[]>([]);

  const [groupSortState, setGroupSortState] = useState(SortState.NEUTRAL);
  const [dateSortState, setDateSortState] = useState(SortState.DECREASING);
  const [durationSortState, setDurationSortState] = useState(SortState.NEUTRAL);

  const [editingSession, setEditingSession] = useState<SessionInfo | undefined>(undefined);

  useEffect(() => {
    setAllGroupNames(getAllGroupNames());
  }, [])

  const filterSessionInfo = (sessionInfo: SessionInfo) => {
    const startDateMs = startDate !== '' ? Date.parse(startDate) : 0;
    const endDateMs = endDate !== '' ? Date.parse(endDate) : 0;
    const sessionDateMs = Date.parse(sessionInfo.dateStr);
    const compareDates = startDateMs !== 0 && endDateMs !== 0;
    return sessionInfo.groupName.startsWith(groupNameFilter) &&
      (!compareDates ||
        (startDateMs <= sessionDateMs && endDateMs >= sessionDateMs))
  };

  const sortSessionInfo = (sessionA: SessionInfo, sessionB: SessionInfo): number => {
    if (dateSortState !== SortState.NEUTRAL) {
      const dateA = Date.parse(sessionA.dateStr);
      const dateB = Date.parse(sessionB.dateStr);
      const rev = dateSortState === SortState.DECREASING ? -1 : 1;
      const comp = rev * (dateA - dateB);
      if (comp !== 0) {
        return comp;
      }
    }

    if (groupSortState !== SortState.NEUTRAL) {
      const rev = groupSortState === SortState.DECREASING ? -1 : 1;
      if (sessionA.groupName > sessionB.groupName) {
        return rev * 1;
      }
      if (sessionA.groupName < sessionB.groupName) {
        return rev * -1;
      }
    }

    if (durationSortState !== SortState.NEUTRAL) {
      const rev = durationSortState === SortState.DECREASING ? -1 : 1;
      return rev * (sessionA.duration - sessionB.duration)
    }

    return 0;
  };

  const resetFilters = () => {
    setGroupNameFilter('');
    setStartDate('');
    setEndDate('');
  };

  const [confirmModalState, setConfirmModalState] = useState(ModalState.NOT_SHOWING);
  const saveSessionRef = useRef<SessionInfo>();

  const handleSave = (sessionInfo: SessionInfo): boolean => {
    setConfirmModalState(ModalState.CONFIRM_SAVE);
    saveSessionRef.current = sessionInfo;
    return false;
  };

  const handleDelete = (sessionInfo: SessionInfo): boolean => {
    setConfirmModalState(ModalState.CONFIRM_DELETE);
    return false;
  };

  const doSave = () => {
    const currentSession = saveSessionRef.current;
    if (currentSession !== undefined) {
      saveSession(currentSession);
      setSessions(sessions.filter(({ sessionID }) => sessionID !== currentSession.sessionID).concat(currentSession));
      setEditingSession(undefined);
    }
  };

  const doDelete = () => {
    if (editingSession !== undefined) {
      deleteSession(editingSession.sessionID)
      setSessions(sessions.filter(({ sessionID }) => sessionID !== editingSession.sessionID))
      setEditingSession(undefined);
    }
  };

  const handleBack = (sessionInfo: SessionInfo): boolean => {
    let diff = false;
    if (editingSession) {
      diff = sessionInfo.groupName !== editingSession.groupName ||
        sessionInfo.dateStr !== editingSession.dateStr ||
        sessionInfo.duration !== editingSession.duration ||
        sessionInfo.participants.length !== editingSession.participants.length ||
        sessionInfo.participants.reduce(
          (soFar: boolean, participant, index) =>
            soFar || (participant !== editingSession.participants[index]), false);
    }

    if (diff) {
      setConfirmModalState(ModalState.CONFIRM_BACK);
    }
    else {
      doBack();
    }

    return false;
  }

  const doBack = () => {
    setEditingSession(undefined);
  };

  const doFuncs = new Map([
    [ModalState.CONFIRM_DELETE, doDelete],
    [ModalState.CONFIRM_SAVE, doSave],
    [ModalState.CONFIRM_BACK, doBack],
  ]);

  const sortButton = (sortState: SortState, setSortState: (sortState: SortState) => void) => (
    <button
      onClick={() => setSortState(getNextSortState(sortState))}
    >
      <div className="session-list-header-sort-container">
        <p
          className={
            sortState !== SortState.DECREASING ? 'sort-button-showing' : 'sort-button-hiding'
          }
        >
          {"\u25b2"}
        </p>
        <p
          className={
            sortState !== SortState.INCREASING ? 'sort-button-showing' : 'sort-button-hiding'
          }
        >
          {"\u25bc"}
        </p>
      </div>
    </button>
  );


  return (
    <AnimatePresence exitBeforeEnter initial={false}>
      <ModalComponent
        handleClose={() => setConfirmModalState(ModalState.NOT_SHOWING)}
        showing={confirmModalState !== ModalState.NOT_SHOWING}
      >
        <div className="page">
          <h3>Are you Sure?</h3>
          <p>{CONFIRM_MODAL_PROMPTS.get(confirmModalState) ?? ''}</p>
          <div className="modal-button-row">
            <button onClick={() => {
              const doFunc = doFuncs.get(confirmModalState) ?? (() => { });
              setConfirmModalState(ModalState.NOT_SHOWING);
              doFunc();
            }}>
              Yes
            </button>
            <button onClick={() => setConfirmModalState(ModalState.NOT_SHOWING)}>No</button>
          </div>
        </div>
      </ModalComponent>
      {editingSession === undefined ? (
        <motion.div
          key='search'
          className="page SessionSearchPage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: .3 }}
        >
          <h2>Find a Session</h2>
          <div className="search-container">
            <p>Filter:</p>
            <SearchDropDown
              className="filter-search-drop-down"
              options={allGroupNames}
              placeholder="Group Name"
              value={groupNameFilter}
              onChange={setGroupNameFilter}
            />
          </div>
          <div className="search-container">
            <p>Date Range:</p>
            <input
              type='date'
              value={startDate}
              onChange={ev => setStartDate(ev.target.value)}
            />
            <p>to</p>
            <input
              type='date'
              value={endDate}
              onChange={ev => setEndDate(ev.target.value)}
            />
          </div>
          <button
            className='reset-filters-button'
            onClick={resetFilters}
          >
            Reset Filters
          </button>
          {sessions.length === 0 ? (<h3>No Saved Sessions</h3>) : (
            <div className="session-list-container">
              <div className="session-list-header-section">
                <div className="session-list-header">
                  <p>Group Name:</p>
                  {sortButton(groupSortState, setGroupSortState)}
                </div>
                <div className="session-list-header">
                  <p>Date:</p>
                  {sortButton(dateSortState, setDateSortState)}
                </div>
                <div className="session-list-header">
                  <p>Duration (hours):</p>
                  {sortButton(durationSortState, setDurationSortState)}
                </div>
              </div>
              {sessions.filter(filterSessionInfo).sort(sortSessionInfo).map(sessionInfo => (
                <div
                  key={sessionInfo.sessionID}
                  className="button session-list-item"
                  onClick={() => setEditingSession(sessionInfo)}
                >
                  <p>{sessionInfo.groupName}</p>
                  <p>{sessionInfo.dateStr}</p>
                  <p>{sessionInfo.duration}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key='edit'
          className="page EditSessionPage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: .3, type: 'spring' }}
        >
          <h2>Edit Group Session</h2>
          <SessionForm
            sessionInfo={editingSession}
            buttons={[['Save', handleSave], ['Delete', handleDelete], ['Back', handleBack]]}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SessionSearchPage;