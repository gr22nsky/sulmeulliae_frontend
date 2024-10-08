import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function Login({ setLoggedIn, setUsername }) {
    const [usernameInput, setUsernameInput] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();

        // 로그인 API 호출
        api.post('/accounts/signin/', { username: usernameInput, password })
            .then((response) => {
                if (response.data.access) {
                    // 토큰을 localStorage에 저장
                    localStorage.setItem('accessToken', response.data.access);
                    localStorage.setItem('refreshToken', response.data.refresh);
                    localStorage.setItem('username', usernameInput);  // 사용자명도 localStorage에 저장
                    localStorage.setItem('userId', response.data.user_id);

                    // 상태 업데이트 및 페이지 이동
                    setUsername(usernameInput);
                    setLoggedIn(true);
                    navigate('/');
                } else {
                    setError('로그인 실패: 잘못된 응답 형식입니다.');
                }
            })
            .catch((error) => {
                setError('로그인 실패: 사용자명 또는 비밀번호를 확인하세요.');
                console.error('로그인 에러:', error);
            });
    };

    return (
        <div>
            <h2>로그인</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>아이디</label>
                    <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>비밀번호</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">로그인</button>
            </form>
        </div>
    );
}

export default Login;
