import React from "react";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import HomePage from "./components/HomePage/HomePage";
import './App.css';
import AboutPage from "./components/AboutPage/AboutPage";
import AppHeader from "./components/AppHeader/AppHeader";
import { AnimatePresence, motion } from "framer-motion";
import AddSessionPage from "./components/AddSessionPage/AddSessionPage";

const TransitionPage = (PageElement: () => JSX.Element, props?: JSX.IntrinsicAttributes): JSX.Element => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: .6 }}
    >
      <PageElement {...props} />
    </motion.div>
  )
}

const App = () => {
  const location = useLocation();
  return (
    <div className="App">
      <AnimatePresence exitBeforeEnter initial={false}>
        {location.pathname === '/' ? null : TransitionPage(AppHeader)}
        <Routes location={location} key={location.pathname}>
          <Route path='/' element={TransitionPage(HomePage)} />
          <Route path='/about' element={TransitionPage(AboutPage)} />
          <Route path='/add-session' element={TransitionPage(AddSessionPage)} />
        </Routes>
      </AnimatePresence>
    </div>
  )
};

export default App;