import { AppProvider, useApp } from "./context/AppContext";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import JobRequestScreen from "./screens/JobRequestScreen";
import ActiveJobScreen from "./screens/ActiveJobScreen";
import EarningsScreen from "./screens/EarningsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import RegisterScreen from "./screens/RegisterScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import OnboardingResultScreen from "./screens/OnboardingResultScreen";
import ChatScreen from "./screens/ChatScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import BottomNav from "./components/BottomNav";

function AppRouter() {
  const { screen } = useApp();
  const renderScreen = () => {
    switch(screen) {
      case "login": return <LoginScreen />;
      case "home": return <HomeScreen />;
      case "jobrequest": return <JobRequestScreen />;
      case "activejob": return <ActiveJobScreen />;
      case "earnings": return <EarningsScreen />;
      case "profile": return <ProfileScreen />;
      case "register": return <RegisterScreen />;
      case "onboarding": return <OnboardingScreen />;
      case "onboarding_result": return <OnboardingResultScreen />;
      case "chat": return <ChatScreen />;
      case "notifications": return <NotificationsScreen />;
      default: return <LoginScreen />;
    }
  };
  const showNav = ["home","earnings","profile","notifications"].includes(screen);
  return (
    <div className="app-shell">
      <div className="screen-content">{renderScreen()}</div>
      {showNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return <AppProvider><AppRouter /></AppProvider>;
}
