import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.client = null;
    }

    connect(onMessageReceived) {
        this.client = new Client({
            brokerURL: process.env.REACT_APP_WS_URL || 'ws://localhost:8080/traffic-websocket',
            webSocketFactory: () => new SockJS(process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/traffic-websocket'),
            debug: (str) => {
                console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: (frame) => {
                console.log('Connected: ' + frame);
                onMessageReceived(this.client);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        this.client.activate();
    }

    subscribe(topic, callback) {
        if (this.client && this.client.connected) {
            return this.client.subscribe(topic, (message) => {
                callback(JSON.parse(message.body));
            });
        }
    }

    disconnect() {
        if (this.client !== null) {
            this.client.deactivate();
        }
        console.log("Disconnected");
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;
