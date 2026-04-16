import { Navigate } from 'react-router-dom';

/**
 * Dashboard antigo — agora redireciona para a home unificada /dashboard-bebe
 */
const Dashboard = () => {
  return <Navigate to="/dashboard-bebe" replace />;
};

export default Dashboard;
