import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import { NeuralCorePage } from './pages/NeuralCorePage';
import { GovernancePage } from './pages/GovernancePage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ArtifactsPage } from './pages/ArtifactsPage';

function AppRoutes() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/neural-core" element={<NeuralCorePage />} />
          <Route path="/governance" element={<GovernancePage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/artifacts" element={<ArtifactsPage />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default AppRoutes;
