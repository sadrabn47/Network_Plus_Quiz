document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const explanationContainer = document.getElementById('explanation-container');
const explanationText = document.getElementById('explanation-text');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconLight = document.getElementById('theme-icon-light');
    const themeIconDark = document.getElementById('theme-icon-dark');
    const welcomeScreen = document.getElementById('welcome-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultsScreen = document.getElementById('results-screen');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const continueQuizBtn = document.getElementById('continue-quiz-btn');
    const questionText = document.getElementById('question-text');
    const questionHint = document.getElementById('question-hint');
    const choicesContainer = document.getElementById('choices-container');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const progressContainer = document.getElementById('progress-container');
    const currentQuestionNumberEl = document.getElementById('current-question-number');
    const totalQuestionsEl = document.getElementById('total-questions');
    const progressBar = document.getElementById('progress-bar');
    const timerEl = document.getElementById('timer');
    const scoreText = document.getElementById('score-text');
    const reviewAnswersBtn = document.getElementById('review-answers-btn');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');
    const reviewSection = document.getElementById('review-section');
    const reviewContainer = document.getElementById('review-container');
    const errorContainer = document.getElementById('error-container');
    const errorMessageEl = document.getElementById('error-message');

    // --- State Variables ---
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let selectedAnswers = [];
    let timerInterval;
    let timeLeft = 2700; // 45 minutes in seconds
    let userAnswers = []; // Store user's answers for review

    // --- Constants ---
    const QUIZ_STATE_KEY = 'quizState';

    // --- Functions ---

    // Theme Management
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            themeIconLight.classList.add('hidden');
            themeIconDark.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            themeIconLight.classList.remove('hidden');
            themeIconDark.classList.add('hidden');
        }
    };

    const toggleTheme = () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    // Error Handling
    const showError = (message) => {
        errorMessageEl.textContent = message;
        errorContainer.classList.remove('hidden');
        welcomeScreen.classList.add('hidden');
        quizScreen.classList.add('hidden');
        resultsScreen.classList.add('hidden');
    };

    // Quiz State Management
    const saveState = () => {
        const state = {
            currentQuestionIndex,
            score,
            timeLeft,
            userAnswers,
        };
        localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(state));
    };

    const loadState = () => {
        const savedState = localStorage.getItem(QUIZ_STATE_KEY);
        if (savedState) {
            return JSON.parse(savedState);
        }
        return null;
    };

    const clearState = () => {
        localStorage.removeItem(QUIZ_STATE_KEY);
    };


    // Quiz Logic
    const startQuiz = (isContinuation = false) => {
        if (!isContinuation) {
            currentQuestionIndex = 0;
            score = 0;
            timeLeft = 2700;
            userAnswers = [];
            clearState();
        }
        
        welcomeScreen.classList.add('hidden');
        resultsScreen.classList.add('hidden');
        reviewSection.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        
        loadQuestion();
        startTimer();
    };

    const startTimer = () => {
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            saveState();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                finishQuiz();
            }
        }, 1000);
    };

    const updateTimerDisplay = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const loadQuestion = () => {
        // Reset from previous question
            explanationContainer.classList.add('hidden'); // <-- ADD THIS LINE
    selectedAnswers = [];    explanationContainer.classList.add('hidden'); // <-- ADD THIS LINE
    selectedAnswers = [];
        selectedAnswers = [];
        choicesContainer.innerHTML = '';
        submitAnswerBtn.disabled = true;
        submitAnswerBtn.classList.remove('hidden');
        nextQuestionBtn.classList.add('hidden');
        
        // Add animation class
        const questionContainer = document.getElementById('question-container');
        questionContainer.classList.remove('question-fade-in');
        void questionContainer.offsetWidth; // Trigger reflow
        questionContainer.classList.add('question-fade-in');


        const question = questions[currentQuestionIndex];
        questionText.textContent = question.question;

        // UPDATED: Changed hint to be more generic for a test environment
        questionHint.textContent = "Select one or more options and click submit.";

        question.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.innerHTML = `
                <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>${choice}</span>
            `;
            button.className = 'choice-btn bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600';
            button.dataset.choice = choice;
            button.setAttribute('aria-pressed', 'false');

            button.addEventListener('click', () => handleChoiceSelection(button, choice));
            choicesContainer.appendChild(button);
        });

        updateProgress();
    };

    const handleChoiceSelection = (button, choice) => {
        if (button.classList.contains('selected')) {
            button.classList.remove('selected');
            button.setAttribute('aria-pressed', 'false');
            selectedAnswers = selectedAnswers.filter(a => a !== choice);
        } else {
            button.classList.add('selected');
            button.setAttribute('aria-pressed', 'true');
            selectedAnswers.push(choice);
        }
        // UPDATED: Enable submit button if at least one answer is selected
        submitAnswerBtn.disabled = selectedAnswers.length === 0;
    };

    const handleSubmitAnswer = () => {
        clearInterval(timerInterval); // Pause timer while reviewing answer
        submitAnswerBtn.classList.add('hidden');
        nextQuestionBtn.classList.remove('hidden');

        const question = questions[currentQuestionIndex];
        const correctAnswers = question.answers;
        
        // Scoring: Award point only if the selection is exactly correct
        const sortedSelected = [...selectedAnswers].sort();
        const sortedCorrect = [...correctAnswers].sort();
        let isCorrect = JSON.stringify(sortedSelected) === JSON.stringify(sortedCorrect);

        if (isCorrect) {
            score++;
        }

        userAnswers[currentQuestionIndex] = selectedAnswers;

        Array.from(choicesContainer.children).forEach(button => {
            const choice = button.dataset.choice;
            button.disabled = true; // Disable all buttons

            if (correctAnswers.includes(choice)) {
                button.classList.add('correct');
            } else if (selectedAnswers.includes(choice)) {
                button.classList.add('incorrect');
            }
        });
        
        if (currentQuestionIndex === questions.length - 1) {
            nextQuestionBtn.textContent = 'Finish Quiz';
        }
        
        saveState();
        explanationText.textContent = question.explanation;
        explanationContainer.classList.remove('hidden');
    };

    const handleNextQuestion = () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
            startTimer(); // Resume timer
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        clearInterval(timerInterval);
        quizScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
        scoreText.textContent = `You scored ${score}/${questions.length} (${score} out of ${questions.length} correct)`;
        clearState();
    };

    const updateProgress = () => {
        currentQuestionNumberEl.textContent = currentQuestionIndex + 1;
        totalQuestionsEl.textContent = questions.length;
        const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    };

    const reviewAnswers = () => {
        reviewContainer.innerHTML = '';
        resultsScreen.classList.add('hidden');
        reviewSection.classList.remove('hidden');

        questions.forEach((q, index) => {
            const userAnswer = userAnswers[index] || [];
            
            const sortedUser = [...userAnswer].sort();
            const sortedCorrect = [...q.answers].sort();
            const isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);

            const reviewBlock = document.createElement('div');
            reviewBlock.className = 'p-4 bg-white dark:bg-gray-800 rounded-lg shadow';
            
            let choicesHtml = q.choices.map(choice => {
                let choiceClass = 'text-gray-700 dark:text-gray-300';
                if (q.answers.includes(choice)) {
                    choiceClass = 'text-green-600 dark:text-green-400 font-bold'; // Correct answer
                }
                if (userAnswer.includes(choice) && !q.answers.includes(choice)) {
                    choiceClass = 'text-red-600 dark:text-red-400 line-through'; // User's incorrect choice
                }
                return `<li class="${choiceClass}">${choice}</li>`;
            }).join('');

          reviewBlock.innerHTML = `
                <p class="font-bold mb-2">${index + 1}. ${q.question}</p>
                <ul class="list-disc list-inside mb-2">
                    ${choicesHtml}
                </ul>
                <p class="text-sm">Your answer: <span class="${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${userAnswer.join(', ') || 'Not answered'}</span></p>
                <p class="text-sm">Correct answer: <span class="text-green-600 dark:text-green-400">${q.answers.join(', ')}</span></p>
                <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p class="text-sm font-semibold">Explanation:</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${q.explanation}</p>
                </div>
                `;
            reviewContainer.appendChild(reviewBlock);
        });
        
        const backButton = document.createElement('button');
        backButton.textContent = 'Back to Start';
        backButton.className = 'mt-6 bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-700';
        backButton.onclick = () => {
            reviewSection.classList.add('hidden');
            welcomeScreen.classList.remove('hidden');
            location.reload(); // Reload to reset state cleanly
        };
        reviewContainer.appendChild(backButton);
    };

    const restartQuiz = () => {
        if (confirm('Are you sure you want to restart? Your progress will be lost.')) {
            clearState();
            location.reload();
        }
    };
    
    const handleKeyPress = (e) => {
        if (quizScreen.classList.contains('hidden')) {
            if (e.key === 'Enter' && !welcomeScreen.classList.contains('hidden')) {
                startQuizBtn.click();
            }
        } else {
            if (e.key >= '1' && e.key <= '4') {
                const choiceIndex = parseInt(e.key) - 1;
                const choiceButton = choicesContainer.children[choiceIndex];
                if (choiceButton && !choiceButton.disabled) {
                    choiceButton.click();
                }
            } else if (e.key === 'Enter' && !submitAnswerBtn.disabled) {
                submitAnswerBtn.click();
            } else if (e.code === 'Space' && !nextQuestionBtn.classList.contains('hidden')) {
                e.preventDefault();
                nextQuestionBtn.click();
            }
        }
    };

    const initializeApp = async () => {
        const savedTheme = localStorage.getItem('theme');
        const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        applyTheme(savedTheme || preferredTheme);
        themeToggle.addEventListener('click', toggleTheme);

        const savedState = loadState();
        if (savedState && savedState.userAnswers.length > 0) {
            continueQuizBtn.classList.remove('hidden');
            continueQuizBtn.addEventListener('click', () => {
                currentQuestionIndex = savedState.currentQuestionIndex;
                score = savedState.score;
                timeLeft = savedState.timeLeft;
                userAnswers = savedState.userAnswers;
                startQuiz(true);
            });
        }

        startQuizBtn.addEventListener('click', () => startQuiz(false));
        submitAnswerBtn.addEventListener('click', handleSubmitAnswer);
        nextQuestionBtn.addEventListener('click', handleNextQuestion);
        reviewAnswersBtn.addEventListener('click', reviewAnswers);
        restartQuizBtn.addEventListener('click', restartQuiz);
        document.addEventListener('keydown', handleKeyPress);

        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                 throw new Error('questions.json is not a valid array or is empty.');
            }
            
            const isValid = data.every(q => 
                q.question && typeof q.question === 'string' &&
                Array.isArray(q.choices) && q.choices.length === 4 &&
                Array.isArray(q.answers) && q.answers.length >= 1 && q.answers.length <= 3
            );

            if (!isValid) {
                throw new Error('One or more questions in questions.json have an invalid format.');
            }

            questions = data;
            
        } catch (error) {
            console.error('Failed to load or parse questions:', error);
            showError(`Could not load quiz questions. Please check the 'questions.json' file and make sure it's accessible and correctly formatted. Details: ${error.message}`);
        }
    };

    initializeApp();
});
