import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, Trophy, RefreshCcw, Timer, Star, ArrowRight, Zap, Heart, Medal, Book } from 'lucide-react';

const UserManager = {
  saveUserProgress(username, quizData) {
    const users = JSON.parse(localStorage.getItem('bisQuizUsers') || '[]');
    const existingUserIndex = users.findIndex(u => u.username === username);

    const quizResult = {
      category: quizData.category,
      score: quizData.score,
      totalQuestions: quizData.totalQuestions,
      timestamp: new Date().toISOString()
    };

    if (existingUserIndex !== -1) {
      // Update existing user
      users[existingUserIndex].quizHistory = users[existingUserIndex].quizHistory || [];
      users[existingUserIndex].quizHistory.push(quizResult);
      users[existingUserIndex].totalPoints = 
        (users[existingUserIndex].totalPoints || 0) + quizData.score;
    } else {
      // Create new user
      users.push({
        username,
        quizHistory: [quizResult],
        totalPoints: quizData.score,
        profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      });
    }

    localStorage.setItem('bisQuizUsers', JSON.stringify(users));
  },

  getLeaderboard() {
    const users = JSON.parse(localStorage.getItem('bisQuizUsers') || '[]');
    return users
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .slice(0, 10);
  }
};

const BISQuizPlatform = () => {
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timer, setTimer] = useState(0);
  const [streak, setStreak] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [lifelines, setLifelines] = useState(2);
  const [showHint, setShowHint] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [confetti, setConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [username, setUsername] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const renderUserRegistration = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Enter Your Username
        </h2>
        <input 
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Choose a username"
          className="w-full p-3 border rounded-xl mb-4 focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={() => username.trim() && setCurrentCategory(null)}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-xl"
        >
          Start Quiz Journey
        </button>
      </div>
    </div>
  );

  // New: Leaderboard Modal
  const renderLeaderboard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 flex justify-between items-center">
          Global Leaderboard
          <button 
            onClick={() => setShowLeaderboard(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </h2>
        <div className="space-y-4">
          {leaderboard.map((user, index) => (
            <div 
              key={user.username} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center space-x-4">
                <img 
                  src={user.profilePicture} 
                  alt={user.username} 
                  className="w-10 h-10 rounded-full"
                />
                <span>{user.username}</span>
              </div>
              <span className="font-bold">{user.totalPoints} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const quizData = {
    standards: {
      title: "Standards & Quality Control",
      icon: "🏆",
      description: "Master the fundamentals of quality standards",
      questions: [
        {
          question: "What does ISI stand for?",
          options: [
            "Indian Standards Institute",
            "International Standards Index",
            "Indian Statistical Institute",
            "Indian Standards Institution"
          ],
          correct: 3,
          explanation: "ISI stands for Indian Standards Institution, established to harmonize national standards."
        },
        {
          question: "Which of these products must mandatorily have BIS certification?",
          options: [
            "Gold Jewelry",
            "Packaged Drinking Water",
            "Steel Products",
            "All of the above"
          ],
          correct: 3,
          explanation: "These products require mandatory BIS certification for consumer safety."
        },
        {
          question: "What is the validity period of a BIS license?",
          options: [
            "1 year",
            "2 years",
            "3 years",
            "5 years"
          ],
          correct: 0,
          explanation: "BIS licenses are valid for 1 year and need annual renewal."
        }
      ]
    },
    awareness: {
      title: "Consumer Awareness",
      icon: "👥",
      description: "Learn to identify authentic certifications",
      questions: [
        {
          question: "How can you verify a genuine BIS certification?",
          options: [
            "Check BIS website",
            "Look for hologram",
            "Scan QR code",
            "All of the above"
          ],
          correct: 3,
          explanation: "Multiple verification methods ensure authenticity of BIS certifications."
        },
        {
          question: "Which of these is a sign of fake BIS certification?",
          options: [
            "Missing hologram",
            "Incorrect license number format",
            "Poor print quality",
            "All of the above"
          ],
          correct: 3,
          explanation: "Being aware of these signs helps identify counterfeit certifications."
        }
      ]
    },
    funFacts: {
      title: "Fun Facts about BIS",
      icon: "💡",
      description: "Discover interesting facts about BIS history",
      questions: [
        {
          question: "When was BIS established?",
          options: [
            "1947",
            "1986",
            "1952",
            "1991"
          ],
          correct: 1,
          explanation: "BIS was established in 1986, replacing the ISI."
        },
        {
          question: "Which was the first product to receive ISI certification?",
          options: [
            "Cement",
            "Steel",
            "Biscuits",
            "Soap"
          ],
          correct: 0,
          explanation: "Cement was the first product to receive ISI certification."
        }
      ]
    }
  };

  useEffect(() => {
    let interval;
    if (currentCategory && !showScore) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentCategory, showScore]);

  const handleCategorySelect = (category) => {
    setCurrentCategory(category);
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedAnswer(null);
    setTimer(0);
    setStreak(0);
    setLifelines(2);
    setShowHint(false);
    setAchievements([]);
  };

  const useLifeline = () => {
    if (lifelines > 0) {
      setLifelines(prev => prev - 1);
      setShowHint(true);
      // Add achievement for using lifeline
      addAchievement('Lifeline Used! 🆘');
    }
  };

  const addAchievement = (achievement) => {
    setAchievements(prev => [...prev, achievement]);
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2000);
  };

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === quizData[currentCategory].questions[currentQuestion].correct;
    
    if (correct) {
      setScore(score + 1);
      setStreak(streak + 1);
      setAnimate(true);
      
      // Achievement system
      if (streak === 3) addAchievement('Hot Streak! 🔥');
      if (score === quizData[currentCategory].questions.length - 1) addAchievement('Perfect Score! 🌟');
    } else {
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    setTimeout(() => {
      if (currentQuestion < quizData[currentCategory].questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setAnimate(false);
        setShowHint(false);
      } else {
        setShowScore(true);
      }
    }, 1500);
  };

  const resetQuiz = () => {
    setCurrentCategory(null);
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedAnswer(null);
    setTimer(0);
    setStreak(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCategorySelection = () => {
    if (!username) {
      return renderUserRegistration();
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.keys(quizData).map((category) => (
          <div
            key={category}
            className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer backdrop-blur-lg bg-opacity-90 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50"
            onClick={() => {
              handleCategorySelect(category);
              // Optional: Load user's previous performance in this category
            }}
          >
            {/* Existing category rendering */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">{quizData[category].questions.length} questions</span>
              <ArrowRight className="text-blue-500 transform group-hover:translate-x-2 transition-transform duration-300" size={20} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderQuestion = () => {
    const currentQuizData = quizData[currentCategory];
    const question = currentQuizData.questions[currentQuestion];

    return (
      <div className={`bg-white p-8 rounded-2xl shadow-lg backdrop-blur-lg bg-opacity-90 transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
        {/* Status Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Timer className="text-blue-500 mr-2 animate-pulse" size={20} />
              <span className="text-gray-600">{formatTime(timer)}</span>
            </div>
            <div className="flex items-center">
              <Star className="text-yellow-500 mr-2" size={20} />
              <span className="text-gray-600">Streak: {streak}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {[...Array(lifelines)].map((_, i) => (
              <Heart key={i} className="text-red-500 hover:scale-110 transition-transform cursor-pointer" size={20} onClick={useLifeline} />
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2 flex items-center">
            Question {currentQuestion + 1}
            <span className="text-sm text-gray-500 ml-2">of {currentQuizData.questions.length}</span>
          </h2>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 transition-all duration-500 ease-out"
              style={{ width: `${((currentQuestion + 1) / currentQuizData.questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <p className="text-xl mb-8 font-medium">{question.question}</p>

        {/* Options */}
        <div className="space-y-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`w-full p-4 text-left rounded-xl transition-all duration-300 border-2 transform hover:scale-102 ${
                selectedAnswer === null
                  ? 'hover:border-blue-500 hover:shadow-md hover:bg-blue-50'
                  : selectedAnswer === index
                  ? index === question.correct
                    ? 'border-green-500 bg-green-50 scale-105'
                    : 'border-red-500 bg-red-50'
                  : index === question.correct
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200'
              }`}
              onClick={() => selectedAnswer === null && handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {selectedAnswer !== null && index === question.correct && (
                  <CheckCircle2 className="text-green-500 animate-bounce" size={20} />
                )}
                {selectedAnswer === index && index !== question.correct && (
                  <XCircle className="text-red-500 animate-shake" size={20} />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Hint */}
        {showHint && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200 animate-fadeIn">
            <p className="text-yellow-800 flex items-center">
              <Zap className="mr-2" size={20} />
              {question.hint}
            </p>
          </div>
        )}

        {/* Explanation */}
        {selectedAnswer !== null && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl animate-slideUp">
            <p className="text-gray-700">{question.explanation}</p>
          </div>
        )}

        {/* Achievements */}
        <div className="fixed top-4 right-4 space-y-2">
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className="bg-white p-2 rounded-lg shadow-lg animate-slideInRight flex items-center space-x-2"
            >
              <Medal className="text-yellow-500" size={16} />
              <span>{achievement}</span>
            </div>
          ))}
        </div>

        {/* Confetti Effect */}
        {confetti && (
          <div className="fixed inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4CAF50', '#2196F3'][Math.floor(Math.random() * 4)],
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };
  const renderScore = () => {
    const totalQuestions = quizData[currentCategory].questions.length;
    const percentage = (score / totalQuestions) * 100;
    
    // Save user progress
    UserManager.saveUserProgress(username, {
      category: currentCategory,
      score,
      totalQuestions
    });

    // Refresh leaderboard
    setLeaderboard(UserManager.getLeaderboard());

    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center backdrop-blur-lg bg-opacity-90 animate-scaleIn">
        {/* Existing score rendering */}
        
        {/* New Leaderboard Button */}
        <button
          onClick={() => setShowLeaderboard(true)}
          className="mt-4 bg-gray-100 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-200 flex items-center mx-auto"
        >
          <Globe className="mr-2" size={20} />
          View Leaderboard
        </button>
      </div>
    );
  };

  // Modify category selection to require username
 

  // Add Leaderboard Button to Main Component
  return (
    <div className="max-w-4xl mx-auto p-6 relative">
      <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
        BIS Interactive Quiz
      </h1>
      <p className="text-center text-gray-600 mb-12">
        Test your knowledge about Bureau of Indian Standards
      </p>
      
      {/* Leaderboard Button */}
      {username && (
        <button 
          onClick={() => {
            setLeaderboard(UserManager.getLeaderboard());
            setShowLeaderboard(true);
          }}
          className="absolute top-6 right-6 bg-gray-100 p-2 rounded-full hover:bg-gray-200"
        >
          <Globe className="text-blue-500" size={24} />
        </button>
      )}

      <div className={`transition-all duration-500 ${animate ? 'transform scale-105' : ''}`}>
        {!currentCategory && renderCategorySelection()}
        {currentCategory && !showScore && renderQuestion()}
        {showScore && renderScore()}
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && renderLeaderboard()}
    </div>
  );
};
export default BISQuizPlatform;
