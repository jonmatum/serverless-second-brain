import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./globals.css";
import Shell from "@/components/shell";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Graph from "@/pages/graph";
import SearchPage from "@/pages/search";
import NodePage from "@/pages/node";
import Concepts from "@/pages/concepts";
import Notes from "@/pages/notes";
import Experiments from "@/pages/experiments";
import Essays from "@/pages/essays";
import Timeline from "@/pages/timeline";
import Tags from "@/pages/tags";
import Capture from "@/pages/capture";
import Callback from "@/pages/callback";
import NotFound from "@/pages/not-found";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/callback" element={<Callback />} />
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="graph" element={<Graph />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="node" element={<NodePage />} />
          <Route path="concepts" element={<Concepts />} />
          <Route path="notes" element={<Notes />} />
          <Route path="experiments" element={<Experiments />} />
          <Route path="essays" element={<Essays />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="tags" element={<Tags />} />
          <Route path="capture" element={<Capture />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
