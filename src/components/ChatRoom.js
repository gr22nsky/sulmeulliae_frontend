import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api'; // axios 인스턴스 불러오기

function ChatRoom() {
    const { roomId } = useParams();  // URL에서 roomId만 가져오기
    const [roomName, setRoomName] = useState('');  // roomName 상태 추가
    const [createdBy, setCreatedBy] = useState(null);  // 채팅방 만든 사람 ID
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const socketRef = useRef(null);
    const navigate = useNavigate();

    const currentUserId = localStorage.getItem('userId');  // 현재 사용자 ID 가져오기
    const currentUsername = localStorage.getItem('username');  // 현재 사용자 이름 가져오기

    useEffect(() => {
        // 채팅방 정보를 API에서 가져오기
        api.get(`/chat/chatrooms/${roomId}/`)
            .then(response => {
                setRoomName(response.data.name);  // roomName 설정
                setCreatedBy(response.data.created_by);  // 채팅방 만든 사람 설정
            })
            .catch(error => {
                console.error('Error fetching room info:', error);
            });

        // WebSocket 연결 시도
        const chatSocket = new WebSocket(`wss://api.sulmeulliae.com/ws/chat/${roomId}/`);
        socketRef.current = chatSocket;

        // WebSocket 연결이 성공했을 때
        chatSocket.onopen = () => {
            // 입장 메시지 전송
            chatSocket.send(JSON.stringify({
                'message': `${currentUsername}님이 채팅방에 입장했습니다.`,
                'type': 'system'
            }));
        };

        // WebSocket에서 메시지를 받았을 때
        chatSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'system') {
                setMessages((prevMessages) => [...prevMessages, { message: data.message }]);
            } else {
                setMessages((prevMessages) => [...prevMessages, { message: data.message, username: data.username }]);
            }
        };

        // WebSocket 연결이 종료되었을 때
        chatSocket.onclose = (e) => {
        };
        // WebSocket 오류 처리
        chatSocket.onerror = (error) => {
            console.error("WebSocket 오류:", error);
        };

        // 컴포넌트 언마운트 시 WebSocket 연결 종료 처리
        return () => {
            if (chatSocket.readyState === WebSocket.OPEN) {
                chatSocket.send(JSON.stringify({
                    'message': `${currentUsername}님이 채팅방을 나갔습니다.`,
                    'type': 'system'
                }));
            }
            chatSocket.close();
        };
    }, [roomId, currentUsername]);

    const sendMessage = () => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                'message': inputMessage,
                'username': currentUsername  // username 포함
            }));
            setInputMessage('');
        } else {
            console.error("WebSocket 연결 상태가 아닙니다. 메시지를 보낼 수 없습니다.");
        }
    };

    const handleDeleteRoom = () => {
        if (window.confirm('정말 이 채팅방을 삭제하시겠습니까?')) {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    'message': '이 채팅방이 삭제되었습니다.',
                    'type': 'system'
                }));
            }

            api.delete(`/chat/chatrooms/${roomId}/delete/`)  // roomId를 사용하여 삭제 요청
                .then(() => {
                    alert('채팅방이 삭제되었습니다.');
                    navigate('/community/drinkmate');  // 삭제 후 채팅방 목록으로 이동
                })
                .catch((error) => {
                    console.error('Error deleting chat room:', error);
                });
        }
    };

    const handleLeaveRoom = () => {
        alert('채팅방을 나갑니다.');
        navigate('/community/drinkmate');  // 나가기 버튼을 눌렀을 때 채팅방 목록으로 이동
    };

    // 카카오톡 스타일 인라인 CSS
    const styles = {
        chatroomContainer: {
            maxWidth: '800px',
            margin: '50px auto',
            padding: '20px',
            backgroundColor: '#faf4e1',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
        },
        chatroomTitle: {
            fontSize: '2rem',
            color: '#333',
            textAlign: 'center',
            marginBottom: '20px',
        },
        chatMessages: {
            height: '400px',
            overflowY: 'auto',
            padding: '10px',
            backgroundColor: '#fff',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
        },
        chatMessage: {
            display: 'flex',
            maxWidth: '60%',  // 최대 너비 설정
            wordBreak: 'break-word',  // 긴 단어도 말줄임
            padding: '10px',
            borderRadius: '10px',
            marginBottom: '10px',
        },
        selfMessage: {
            marginLeft: 'auto',
            backgroundColor: '#ffe600',
            borderRadius: '10px 10px 0 10px',
            textAlign: 'right',
        },
        otherMessage: {
            marginRight: 'auto',
            backgroundColor: '#f0f0f0',
            borderRadius: '10px 10px 10px 0',
            textAlign: 'left',
        },
        chatInputContainer: {
            display: 'flex',
        },
        chatInput: {
            flexGrow: 1,
            padding: '10px',
            borderRadius: '20px',
            border: '1px solid #ddd',
            marginRight: '10px',
        },
        sendButton: {
            backgroundColor: '#ffd700',
            border: 'none',
            borderRadius: '20px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontWeight: 'bold',
        },
        chatroomActions: {
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '20px',
        },
        leaveButton: {
            backgroundColor: '#6c757d',
            padding: '10px',
            borderRadius: '5px',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
        },
        deleteButton: {
            backgroundColor: '#ff1744',
            padding: '10px',
            borderRadius: '5px',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
        },
    };

    return (
        <div style={styles.chatroomContainer}>
            <h2 style={styles.chatroomTitle}>{roomName}</h2>
            <div style={styles.chatMessages}>
                {messages.map((message, index) => (
                    <div
                        key={index}
                        style={
                            message.username === currentUsername
                                ? { ...styles.chatMessage, ...styles.selfMessage }
                                : { ...styles.chatMessage, ...styles.otherMessage }
                        }
                    >
                        {message.username ? <strong>{message.username}:</strong> : null} {message.message}
                    </div>
                ))}
            </div>
            <div style={styles.chatInputContainer}>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            sendMessage();
                        }
                    }}
                    placeholder="메시지를 입력하세요..."
                    style={styles.chatInput}
                />
                <button onClick={sendMessage} style={styles.sendButton}>전송</button>
            </div>
            <div style={styles.chatroomActions}>
                <button style={styles.leaveButton} onClick={handleLeaveRoom}>나가기</button>
                {createdBy === Number(currentUserId) && (
                    <button style={styles.deleteButton} onClick={handleDeleteRoom}>채팅방 삭제</button>
                )}
            </div>
        </div>
    );
}

export default ChatRoom;

