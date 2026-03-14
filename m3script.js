    (function() {
        // ----------: каждый вопрос с 4 вариантами и правильным индексом (0..3) ----------
        const questions = [
            {
                text: "Что такое метрика в контексте мониторинга?",
                options: [
                    "Файл с логами ошибок приложения",
                    "Числовое значение, измеряемое во времени (например, количество запросов в секунду)",
                    "Графическое отображение данных в дашборде",
                    "Конфигурационный файл системы мониторинга"
                ],
                correct: 1,
                explanation: "Объяснение: Колонка Объяснение: Метрика — это числовой показатель, который собирается через определённые интервалы времени и позволяет отслеживать состояние системы."

            },
            {
                text: "Какая основная задача системы мониторинга?: Вы смотрите на процесс clickhouse-server в утилите top. В колонке %CPU отображается значение 385.2%. Вопрос: Сколько ядер процессора фактически использует ClickHouse в этот момент?",
                options: [
                    "Хранение резервных копий данных",
                    "Ускорение выполнения запросов к базе данных",
                    "Сбор, хранение и визуализация данных о состоянии систем",
                    "Автоматическое исправление ошибок в коде"
                ],
                correct: 2,
                explanation: "Объяснение: Мониторинг позволяет собирать данные о работе систем, анализировать их и своевременно реагировать на проблемы."     // Л. Толстой
            },
            {
                text: "Какой тип метрики используется для подсчёта общего количества событий?",
                options: [
                    "Gauge — значение может увеличиваться и уменьшаться",
                    "Counter — значение только увеличивается",
                    "Histogram — распределение значений по диапазонам",
                    "Summary — статистические показатели (перцентили)",
                ],
                correct: 1,
                explanation: "Объяснение: Counter — это метрика, которая только растёт (или сбрасывается при перезапуске). Идеально подходит для подсчёта событий."
            },
            {
                text: "Как Prometheus получает метрики от экспортеров?",
                options: [
                    "Экспортеры сами отправляют данные в Prometheus (push-модель)",
                    "prometheus периодически опрашивает экспортеры по HTTP (pull-модель) ", 
                    "Через общую базу данных, куда пишут оба компонентан", 
                    "КЧерез систему сообщений (message queue)",
                ],
                correct: 1,
                explanation: "Объяснение: Prometheus использует pull-модель: он сам подключается к эндпоинтам экспортеров и забирает метрики."
            },/*
            ,
            {
                text: "Какое животное является символом Всемирного фонда дикой природы (WWF)?",
                options: ["Панда", "Тигр", "Слон", "Кит"],
                correct: 0      // Панда
            },
            {
                text: "В каком году человек впервые высадился на Луну?",
                options: ["1965", "1969", "1972", "1958"],
                correct: 1      // 1969
            }
            */
        ];

        // ---------- состояние приложения ----------
        let currentIndex = 0;                     // индекс текущего вопроса (0..n-1)
        let userAnswers = new Array(questions.length).fill(null); // null или выбранный индекс (0..3)
        let answerStatus = new Array(questions.length).fill(false); // был ли уже отвечено (для блокировки)
        // но мы можем объединить: userAnswers[i] !== null значит отвечено

        // ---------- DOM элементы ----------
        const questionEl = document.getElementById('questionDisplay');
        const optionsGrid = document.getElementById('optionsContainer');
        const feedbackEl = document.getElementById('feedbackMessage');
        const scoreSpan = document.getElementById('scoreValue');
        const totalQuestionsSpan = document.getElementById('totalQuestions');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const restartHeadBtn = document.getElementById('restartHeadBtn');

        // вспомогательная: подсчёт правильных ответов
        function computeScore() {
            let correctCount = 0;
            for (let i = 0; i < questions.length; i++) {
                if (userAnswers[i] !== null && userAnswers[i] === questions[i].correct) {
                    correctCount++;
                }
            }
            return correctCount;
        }

        // обновить счёт и общее количество на панели
        function updateScoreDisplay() {
            const correct = computeScore();
            scoreSpan.textContent = correct;
            totalQuestionsSpan.textContent = questions.length;
        }

        // рендер вариантов и состояния для текущего вопроса
        function renderQuestion() {
            const q = questions[currentIndex];
            questionEl.textContent = q.text;

            // строим кнопки вариантов (всегда 4)
            let htmlStr = '';
            const letters = ['A', 'B', 'C', 'D'];
            const selectedIdx = userAnswers[currentIndex]; // может быть null или 0..3

            for (let i = 0; i < q.options.length; i++) {
                const opt = q.options[i];
                const letter = letters[i];
                // классы для стилей
                let btnClass = 'option-btn';
                if (selectedIdx !== null) {
                    // если на этот вопрос уже отвечали – применяем цвет корректности
                    if (i === q.correct) {
                        btnClass += ' selected-correct'; // правильный вариант всегда зелёный (подсветка)
                    } else if (i === selectedIdx && selectedIdx !== q.correct) {
                        btnClass += ' selected-wrong'; // неверный выбор пользователя
                    }
                    // остальные без дополнительного класса (можно сероватые, но сохраняем фон)
                }

                // data-атрибут с индексом
                htmlStr += `<button class="${btnClass}" data-opt-index="${i}" ${selectedIdx !== null ? 'disabled' : ''}>
                    <span class="prefix">${letter}</span> ${opt}
                </button><br>`;
            }
            optionsGrid.innerHTML = htmlStr;

            // сообщение в зависимости от того, отвечено или нет
            if (selectedIdx !== null) {
                if (selectedIdx === q.correct) {
                    const explanationText = q.explanation;
                    feedbackEl.textContent = `✅ Верно!: ${explanationText}`;
                } else {
                    const correctLetter = letters[q.correct];
                    const correctText = q.options[q.correct];
                    feedbackEl.textContent = `❌ Неверно. Правильный ответ: ${correctLetter} — ${correctText}.`;
                }
            } else {
                feedbackEl.textContent = 'Выберите один из 4 вариантов';
            }

            // состояние навигации
            prevBtn.disabled = (currentIndex === 0);
            // кнопка "далее" активна, если текущий вопрос отвечен ИЛИ мы не в конце (но даже в конце можно сделать активной, чтобы была видна, но логичнее: если есть ответ или достигнут конец?)
            // сделаем: далее доступен всегда, если есть ответ на текущий ИЛИ мы уже прошли (чтобы можно было перемещаться по отвеченным)
            // но в конце текста кнопка может быть "завершить"? оставим "далее" для перехода, на последнем она будет disabled если последний вопрос? лучше разрешить на последнем переход на 0+? поставим логику: на последнем делаем не disabled, но предлагаем действие? тут просто циклический переход запретим, поэтому на последнем next отключаем, если нет следующего.
            if (currentIndex === questions.length - 1) {
                // последний вопрос: можно сделать надпись "завершено" но сохраним активной, чтобы удобно было смотреть? но перехода нет - поэтому disable.
                nextBtn.disabled = true; // нет следующего вопроса
            } else {
                // не последний: активен, только если на этот вопрос дан ответ (можем разрешить двигаться только если ответили)
                nextBtn.disabled = (userAnswers[currentIndex] === null);
            }

            // дополнительно, если на последнем ответили, то next всё равно true? оставляем disabled, т.к. нет следующего.
            // но может быть приятно оставить активной, но без функции. поставим логику: если currentIndex === len-1, то всегда disabled.
            // переопределим:
            if (currentIndex === questions.length - 1) {
                nextBtn.disabled = true;
            } else {
                nextBtn.disabled = (userAnswers[currentIndex] === null);
            }

            updateScoreDisplay();
        }

        // обработчик клика по варианту (делегирование)
        function handleOptionClick(e) {
            const target = e.target.closest('.option-btn');
            if (!target) return;
            if (target.disabled) return; // дополнительная страховка

            const optIndex = target.dataset.optIndex;
            if (optIndex === undefined) return;

            const idx = parseInt(optIndex, 10);
            // если уже отвечали на текущий вопрос, игнорируем
            if (userAnswers[currentIndex] !== null) return;

            // записываем ответ
            userAnswers[currentIndex] = idx;

            // перерендерить вопрос с новыми классами и disabled
            renderQuestion();

            // дополнительно: если после ответа на последнем кнопки всё ещё корректны, но на последнем next disabled (логика уже в render)
        }

        // переходы
        function goPrev() {
            if (currentIndex > 0) {
                currentIndex--;
                renderQuestion();
            }
        }

        function goNext() {
            if (currentIndex < questions.length - 1 && userAnswers[currentIndex] !== null) {
                currentIndex++;
                renderQuestion();
            }
        }

        // полный сброс
        function restartQuiz() {
            currentIndex = 0;
            userAnswers = new Array(questions.length).fill(null);
            renderQuestion();
        }

        // инициализация и слушатели
        function init() {
            totalQuestionsSpan.textContent = questions.length;
            renderQuestion();

            optionsGrid.addEventListener('click', handleOptionClick);

            prevBtn.addEventListener('click', goPrev);
            nextBtn.addEventListener('click', goNext);

            restartHeadBtn.addEventListener('click', restartQuiz);

            // дополнительно можно добавить клавиатуру, но не требуется
        }

        init();
    })();
