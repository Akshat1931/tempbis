import React, { useState, useEffect, useReducer, useCallback, useMemo, useRef } from 'react';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { AlertCircle, Trophy, Clock, Star, Award, TrendingUp, Users, Brain } from 'lucide-react';

// Enhanced State Management with more features
const initialState = {
  user: null,
  quiz: {
    currentQuestion: null,
    questions: [],
    score: 0,
    streak: 0,
    timeRemaining: 30,
    category: null,
    difficulty: 'medium',
    powerUps: {
      timeFreeze: 2,
      fiftyFifty: 2,
      skipQuestion: 1
    }
  },
  leaderboard: {
    daily: [],
    weekly: [],
    allTime: []
  },
  realTimeEvents: [],
  achievements: {
    unlocked: [],
    progress: {},
    recentUnlock: null
  },
  gameMode: 'casual', // casual, ranked, tournament
  socialFeatures: {
    onlinePlayers: [],
    challenges: [],
    friends: []
  },
  statistics: {
    questionsAnswered: 0,
    correctAnswers: 0,
    averageTime: 0,
    categoryPerformance: {},
    dailyStreak: 0
  }
};

// Enhanced Reducer with More Actions
function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'UPDATE_QUIZ_STATE':
      return { 
        ...state, 
        quiz: { ...state.quiz, ...action.payload } 
      };
    case 'UPDATE_LEADERBOARD':
      return { 
        ...state, 
        leaderboard: { 
          ...state.leaderboard, 
          [action.board]: action.payload 
        } 
      };
    case 'ADD_REAL_TIME_EVENT':
      return { 
        ...state, 
        realTimeEvents: [
          ...state.realTimeEvents.slice(-15), 
          { ...action.payload, timestamp: new Date().toISOString() }
        ]
      };
    case 'UNLOCK_ACHIEVEMENT':
      return {
        ...state,
        achievements: {
          ...state.achievements,
          unlocked: [...state.achievements.unlocked, action.payload],
          recentUnlock: action.payload,
          progress: {
            ...state.achievements.progress,
            [action.payload.id]: 100
          }
        }
      };
    case 'UPDATE_STATISTICS':
      return {
        ...state,
        statistics: {
          ...state.statistics,
          ...action.payload
        }
      };
    case 'USE_POWER_UP':
      return {
        ...state,
        quiz: {
          ...state.quiz,
          powerUps: {
            ...state.quiz.powerUps,
            [action.powerUp]: state.quiz.powerUps[action.powerUp] - 1
          }
        }
      };
    case 'SET_GAME_MODE':
      return { ...state, gameMode: action.payload };
    case 'UPDATE_SOCIAL_FEATURES':
      return {
        ...state,
        socialFeatures: {
          ...state.socialFeatures,
          ...action.payload
        }
      };
    default:
      return state;
  }
}

const BISQuizMaster = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [webSocket, setWebSocket] = useState(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const timerRef = useRef(null);
  const answerTimeRef = useRef(null);

  // Enhanced WebSocket Connection
  useEffect(() => {
    const client = new W3CWebSocket('ws://your-websocket-server.com/quiz');
    
    const reconnectWebSocket = () => {
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        setWebSocket(new W3CWebSocket('ws://your-websocket-server.com/quiz'));
      }, 3000);
    };

    client.onopen = () => {
      console.log('WebSocket Connected');
      dispatch({
        type: 'ADD_REAL_TIME_EVENT',
        payload: {
          type: 'system',
          message: 'Connected to Quiz Arena',
          icon: 'connection'
        }
      });
    };

    client.onclose = () => {
      console.log('WebSocket Disconnected');
      reconnectWebSocket();
    };

    client.onerror = (error) => {
      console.error('WebSocket Error:', error);
      client.close();
    };

    client.onmessage = (message) => {
      const data = JSON.parse(message.data);
      
      switch (data.type) {
        case 'LEADERBOARD_UPDATE':
          dispatch({ 
            type: 'UPDATE_LEADERBOARD',
            board: data.board,
            payload: data.leaderboard 
          });
          break;
        case 'NEW_QUESTION':
          setAnswerSubmitted(false);
          dispatch({
            type: 'UPDATE_QUIZ_STATE',
            payload: { 
              currentQuestion: data.question,
              timeRemaining: 30
            }
          });
          startQuestionTimer();
          break;
        case 'GLOBAL_EVENT':
          dispatch({
            type: 'ADD_REAL_TIME_EVENT',
            payload: data.event
          });
          break;
        case 'PLAYER_JOIN':
          dispatch({
            type: 'UPDATE_SOCIAL_FEATURES',
            payload: {
              onlinePlayers: data.onlinePlayers
            }
          });
          break;
        case 'CHALLENGE_RECEIVED':
          handleChallengeReceived(data.challenge);
          break;
      }
    };

    setWebSocket(client);

    return () => {
      client.close();
    };
  }, []);

  // Enhanced Timer Management
  const startQuestionTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    answerTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      dispatch({
        type: 'UPDATE_QUIZ_STATE',
        payload: { 
          timeRemaining: Math.max(0, state.quiz.timeRemaining - 1) 
        }
      });

      if (state.quiz.timeRemaining <= 0) {
        clearInterval(timerRef.current);
        if (!answerSubmitted) {
          handleTimeUp();
        }
      }
    }, 1000);
  }, [state.quiz.timeRemaining, answerSubmitted]);

  // Enhanced Profile Management
  const createProfile = useCallback((username) => {
    const newUser = {
      id: `user_${Date.now()}`,
      username,
      profileLevel: 1,
      totalXP: 0,
      specialization: null,
      badges: [],
      preferences: {
        theme: 'default',
        soundEffects: true,
        notifications: true
      }
    };

    dispatch({ type: 'SET_USER', payload: newUser });
    
    webSocket?.send(JSON.stringify({
      type: 'USER_REGISTER',
      user: newUser
    }));
  }, [webSocket]);

  // Enhanced Quiz Mechanics
  const startQuiz = useCallback(() => {
    webSocket?.send(JSON.stringify({
      type: 'START_QUIZ',
      userId: state.user?.id,
      gameMode: state.gameMode,
      difficulty: state.quiz.difficulty
    }));
  }, [webSocket, state.user, state.gameMode, state.quiz.difficulty]);

  const submitAnswer = useCallback((selectedOption) => {
    if (answerSubmitted) return;
    
    setAnswerSubmitted(true);
    clearInterval(timerRef.current);
    
    const answerTime = (Date.now() - answerTimeRef.current) / 1000;
    
    webSocket?.send(JSON.stringify({
      type: 'ANSWER_SUBMIT',
      userId: state.user?.id,
      questionId: state.quiz.currentQuestion.id,
      selectedOption,
      timeSpent: answerTime,
      gameMode: state.gameMode
    }));

    // Update statistics
    dispatch({
      type: 'UPDATE_STATISTICS',
      payload: {
        questionsAnswered: state.statistics.questionsAnswered + 1,
        averageTime: (state.statistics.averageTime * state.statistics.questionsAnswered + answerTime) / 
          (state.statistics.questionsAnswered + 1)
      }
    });
  }, [webSocket, state.user, state.quiz.currentQuestion, state.gameMode, state.statistics, answerSubmitted]);

  // Power-Ups System
  const usePowerUp = useCallback((powerUpType) => {
    if (state.quiz.powerUps[powerUpType] > 0) {
      dispatch({ type: 'USE_POWER_UP', powerUp: powerUpType });
      
      switch (powerUpType) {
        case 'timeFreeze':
          clearInterval(timerRef.current);
          setTimeout(startQuestionTimer, 5000);
          break;
        case 'fiftyFifty':
          // Implementation for removing two wrong answers
          break;
        case 'skipQuestion':
          webSocket?.send(JSON.stringify({
            type: 'SKIP_QUESTION',
            userId: state.user?.id
          }));
          break;
      }
    }
  }, [state.quiz.powerUps, startQuestionTimer]);

  // Enhanced Achievement System
  const checkAchievements = useCallback(() => {
    const achievements = {
      'QUIZ_MASTER': {
        id: 'QUIZ_MASTER',
        condition: state.quiz.streak >= 10,
        title: 'Quiz Master',
        description: 'Maintain a streak of 10 correct answers'
      },
      'KNOWLEDGE_SEEKER': {
        id: 'KNOWLEDGE_SEEKER',
        condition: state.quiz.score >= 500,
        title: 'Knowledge Seeker',
        description: 'Earn 500 points in total'
      },
      'SPEED_DEMON': {
        id: 'SPEED_DEMON',
        condition: state.statistics.averageTime < 5 && state.statistics.questionsAnswered > 10,
        title: 'Speed Demon',
        description: 'Average answer time under 5 seconds'
      }
    };

    Object.values(achievements).forEach((achievement) => {
      if (achievement.condition && !state.achievements.unlocked.includes(achievement.id)) {
        dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: achievement });
        setShowAchievement(true);
        setTimeout(() => setShowAchievement(false), 3000);
      }
    });
  }, [state.quiz.streak, state.quiz.score, state.statistics, state.achievements.unlocked]);

  // Social Features
  const handleChallengeReceived = useCallback((challenge) => {
    dispatch({
      type: 'ADD_REAL_TIME_EVENT',
      payload: {
        type: 'challenge',
        message: `${challenge.from} has challenged you to a quiz duel!`,
        action: () => acceptChallenge(challenge.id)
      }
    });
  }, []);

  const acceptChallenge = useCallback((challengeId) => {
    webSocket?.send(JSON.stringify({
      type: 'ACCEPT_CHALLENGE',
      userId: state.user?.id,
      challengeId
    }));
  }, [webSocket, state.user]);

  // Enhanced UI Components
  const renderQuizInterface = () => (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-6 h-6" />
          <span className="text-xl font-bold">{state.quiz.timeRemaining}s</span>
        </div>
        <div className="flex space-x-4">
          {Object.entries(state.quiz.powerUps).map(([powerUp, count]) => (
            <button
              key={powerUp}
              onClick={() => usePowerUp(powerUp)}
              disabled={count === 0}
              className={`px-3 py-1 rounded ${count > 0 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
            >
              {powerUp}: {count}
            </button>
          ))}
        </div>
      </div>

      {state.quiz.currentQuestion ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">{state.quiz.currentQuestion.text}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.quiz.currentQuestion.options.map((option, index) => (
              <button 
                key={index} 
                onClick={() => submitAnswer(option)}
                disabled={answerSubmitted}
                className={`p-4 rounded-lg border-2 transition-all
                  ${answerSubmitted 
                    ? option === state.quiz.currentQuestion.correct
                      ? 'bg-green-100 border-green-500'
                      : 'bg-red-100 border-red-500'
                    : 'hover:bg-blue-50 border-gray-200'
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <button 
            onClick={startQuiz}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            Begin Quiz Challenge
          </button>
        </div>
      )}
    </div>
  );

  const renderLeaderboard = () => (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Leaderboard</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => dispatch({ type: 'SET_GAME_MODE', payload: 'casual' })}
            className={`px-3 py-1 rounded ${state.gameMode === 'casual' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Casual
          </button>
          <button 
            onClick={() => dispatch({ type: 'SET_GAME_MODE', payload: 'ranked' })}
            className={`px-3 py-1 rounded ${state.gameMode === 'ranked' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Ranked
          </button>
          <button 
            onClick={() => dispatch({ type: 'SET_GAME_MODE', payload: 'tournament' })}
            className={`px-3 py-1 rounded ${state.gameMode === 'tournament' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Tournament
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {Object.entries(state.leaderboard).map(([board, leaders]) => (
          <div key={board} className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2 capitalize">{board} Rankings</h4>
            {leaders.slice(0, 5).map((user, index) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full
                    ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>{user.username}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>{user.score}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      {!state.user ? (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Create Your Profile</h3>
          <input 
            type="text" 
            placeholder="Choose Your Expert Username"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                createProfile(e.target.value.trim());
              }
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{state.user.username}</h2>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>Level {state.user.profileLevel}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600">Total XP</div>
              <div className="text-xl font-bold">{state.user.totalXP}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600">Daily Streak</div>
              <div className="text-xl font-bold">{state.statistics.dailyStreak} days</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Achievements</h4>
            <div className="grid grid-cols-2 gap-2">
              {state.achievements.unlocked.map((achievement) => (
                <div 
                  key={achievement.id}
                  className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg"
                >
                  <Award className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm">{achievement.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Questions Answered</div>
                <div className="font-bold">{state.statistics.questionsAnswered}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg. Response Time</div>
                <div className="font-bold">{state.statistics.averageTime.toFixed(1)}s</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRealTimeEvents = () => (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4">Live Feed</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {state.realTimeEvents.map((event, index) => (
          <div 
            key={index} 
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50"
          >
            {event.type === 'system' && <AlertCircle className="w-4 h-4 text-blue-500" />}
            {event.type === 'achievement' && <Award className="w-4 h-4 text-yellow-500" />}
            {event.type === 'challenge' && <Users className="w-4 h-4 text-green-500" />}
            <div className="flex-1">
              <p className="text-sm">{event.message}</p>
              {event.action && (
                <button 
                  onClick={event.action}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  Accept Challenge
                </button>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Achievement Popup
  const renderAchievementPopup = () => (
    state.achievements.recentUnlock && showAchievement && (
      <div className="fixed top-4 right-4 bg-yellow-100 border-2 border-yellow-500 p-4 rounded-lg shadow-lg animate-slide-in">
        <div className="flex items-center space-x-3">
          <Award className="w-8 h-8 text-yellow-600" />
          <div>
            <h4 className="font-bold">{state.achievements.recentUnlock.title}</h4>
            <p className="text-sm text-yellow-700">{state.achievements.recentUnlock.description}</p>
          </div>
        </div>
      </div>
    )
  );

  // Handle time up
  const handleTimeUp = useCallback(() => {
    webSocket?.send(JSON.stringify({
      type: 'TIME_UP',
      userId: state.user?.id,
      questionId: state.quiz.currentQuestion?.id
    }));
    
    dispatch({
      type: 'UPDATE_STATISTICS',
      payload: {
        questionsAnswered: state.statistics.questionsAnswered + 1
      }
    });
  }, [webSocket, state.user, state.quiz.currentQuestion, state.statistics.questionsAnswered]);

  // Main render
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {renderQuizInterface()}
            {renderRealTimeEvents()}
          </div>
          <div className="space-y-6">
            {renderProfile()}
            {renderLeaderboard()}
          </div>
        </div>
      </div>
      {renderAchievementPopup()}
    </div>
  );
};

export default BISQuizMaster;