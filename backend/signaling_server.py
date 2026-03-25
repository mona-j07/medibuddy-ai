import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'signaling-secret-key')
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet', logger=True)

# Store active rooms and participants
rooms = {}
participant_rooms = {}

class VideoRoom:
    def __init__(self, room_id, creator_id):
        self.room_id = room_id
        self.creator_id = creator_id
        self.participants = set([creator_id])
        self.created_at = datetime.now()
    
    def add_participant(self, participant_id):
        self.participants.add(participant_id)
        return len(self.participants)
    
    def remove_participant(self, participant_id):
        self.participants.discard(participant_id)
        return len(self.participants)
    
    def get_participants(self):
        return list(self.participants)
    
    def is_empty(self):
        return len(self.participants) == 0

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('connected', {'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')
    # Clean up rooms
    if request.sid in participant_rooms:
        room_id = participant_rooms[request.sid]
        if room_id in rooms:
            rooms[room_id].remove_participant(request.sid)
            emit('user-left', {'userId': request.sid}, room=room_id)
            if rooms[room_id].is_empty():
                del rooms[room_id]
        del participant_rooms[request.sid]

@socketio.on('join-room')
def handle_join_room(data):
    room_id = data.get('roomId')
    user_id = data.get('userId') or request.sid
    
    if not room_id:
        emit('error', {'message': 'Room ID required'})
        return
    
    # Create or get room
    if room_id not in rooms:
        rooms[room_id] = VideoRoom(room_id, user_id)
        print(f'Room created: {room_id} by {user_id}')
    else:
        rooms[room_id].add_participant(user_id)
    
    # Store participant room mapping
    participant_rooms[user_id] = room_id
    
    # Join Socket.IO room
    join_room(room_id)
    
    # Get existing participants (excluding current user)
    existing_participants = [p for p in rooms[room_id].get_participants() if p != user_id]
    
    # Send existing participants to the new user
    emit('existing-participants', existing_participants)
    
    # Notify others about new participant
    emit('user-joined', user_id, room=room_id, skip_sid=request.sid)
    
    print(f'User {user_id} joined room {room_id}. Participants: {rooms[room_id].get_participants()}')

@socketio.on('leave-room')
def handle_leave_room(data):
    room_id = data.get('roomId')
    user_id = data.get('userId') or request.sid
    
    if room_id and room_id in rooms:
        rooms[room_id].remove_participant(user_id)
        leave_room(room_id)
        emit('user-left', {'userId': user_id}, room=room_id)
        
        if rooms[room_id].is_empty():
            del rooms[room_id]
        
        if user_id in participant_rooms:
            del participant_rooms[user_id]
        
        print(f'User {user_id} left room {room_id}')

@socketio.on('offer')
def handle_offer(data):
    """Handle WebRTC offer"""
    to_user = data.get('to')
    offer = data.get('offer')
    
    if to_user:
        emit('offer', {
            'from': request.sid,
            'offer': offer
        }, room=to_user)

@socketio.on('answer')
def handle_answer(data):
    """Handle WebRTC answer"""
    to_user = data.get('to')
    answer = data.get('answer')
    
    if to_user:
        emit('answer', {
            'from': request.sid,
            'answer': answer
        }, room=to_user)

@socketio.on('ice-candidate')
def handle_ice_candidate(data):
    """Handle ICE candidate"""
    to_user = data.get('to')
    candidate = data.get('candidate')
    
    if to_user:
        emit('ice-candidate', {
            'from': request.sid,
            'candidate': candidate
        }, room=to_user)

@socketio.on('get-rooms')
def handle_get_rooms():
    """Get list of active rooms"""
    room_list = []
    for room_id, room in rooms.items():
        room_list.append({
            'roomId': room_id,
            'participants': len(room.participants),
            'createdAt': room.created_at.isoformat()
        })
    emit('rooms-list', room_list)

@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    """REST endpoint to get active rooms"""
    room_list = []
    for room_id, room in rooms.items():
        room_list.append({
            'roomId': room_id,
            'participants': len(room.participants),
            'createdAt': room.created_at.isoformat()
        })
    return jsonify(room_list)

@app.route('/api/rooms/<room_id>', methods=['GET'])
def get_room(room_id):
    """Get specific room info"""
    if room_id in rooms:
        return jsonify({
            'roomId': room_id,
            'participants': rooms[room_id].get_participants(),
            'participantCount': len(rooms[room_id].participants),
            'createdAt': rooms[room_id].created_at.isoformat()
        })
    return jsonify({'error': 'Room not found'}), 404

if __name__ == '__main__':
    print("Starting WebRTC Signaling Server on port 5001...")
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)