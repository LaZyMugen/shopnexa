import { EventEmitter } from 'events';

// Singleton event bus for app-wide realtime events
const bus = new EventEmitter();
// Increase listener limit to avoid memory leak warnings for many SSE clients
bus.setMaxListeners(100);
export default bus;
