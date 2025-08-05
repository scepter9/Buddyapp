import { registerRootComponent } from 'expo';
import App from './App';
import Login from './screens/Login';
import About from './screens/About';
import Profile from './screens/Profile'
import Register from './screens/Register';
import NotificationScreen from './screens/NotificationsScreen';
import Messages from './screens/Messages'

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);