import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import PrivateRoute from '../components/PrivateRoute';

// Página de login de exemplo
const Login = () => {
  return <h1>Página de Login</h1>;
};

// Página inicial protegida
const Home = () => {
  return <h1>Página Inicial (Protegida)</h1>;
};

// Página pública
const About = () => {
  return <h1>Sobre nós (Público)</h1>;
};

function AppExemplo() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/sobre" element={<About />} />
          
          {/* Rotas protegidas */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } 
          />
          
          {/* Rota protegida com redirecionamento personalizado */}
          <Route 
            path="/admin" 
            element={
              <PrivateRoute 
                redirectPath="/acesso-negado"
                loadingComponent={<div>Verificando credenciais...</div>}
              >
                <h1>Área Administrativa</h1>
              </PrivateRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default AppExemplo; 