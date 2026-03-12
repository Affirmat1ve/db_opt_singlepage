    (function() {
        // ----------: каждый вопрос с 4 вариантами и правильным индексом (0..3) ----------
        const questions = [
            {
                text: "Ситуация: Вы запустили утилиту vmstat для мониторинга системы во время выполнения аналитического запроса в ClickHouse. Обратили внимание, что значение в колонке wa (I/O wait) стабильно держится на уровне 45%. Вопрос: Что означает это значение и какие действия необходимо предпринять?",
                options: [
                    "Это нормальное значение, ClickHouse использует 45% CPU для вычислений.",
                    "45% времени процессор простаивает в ожидании операций ввода-вывода с диском — это критическое узкое место.",
                    "45% оперативной памяти используется под кэш файловой системы.",
                    "Сеть работает медленно, 45% пакетов теряется при передаче данных."
                ],
                correct: 1,
                explanation: "Объяснение: Колонка wa (iowait) показывает процент времени, когда CPU не занят полезной работой, а ждет завершения операций чтения/записи диска. Значение 45% означает, что почти половина времени процессора тратится впустую. Для SSD нормальным считается значение <5%, для HDD <10%. Рекомендуемые действия: проверить утилизацию диска через iostat, рассмотреть замену HDD на SSD/NVMe, оптимизировать запросы для снижения нагрузки на диск."     
            },
            {
                text: "Ситуация: Вы смотрите на процесс clickhouse-server в утилите top. В колонке %CPU отображается значение 385.2%. Вопрос: Сколько ядер процессора фактически использует ClickHouse в этот момент?",
                options: [
                    "Примерно 3.85 ядра (так как 100% = одно ядро).",
                    "385 ядер одновременно.",
                    "38.5% от одного ядра.",
                    "Это ошибка измерения, значение не может превышать 100%."
                ],
                correct: 0,
                explanation: "Объяснение: В Linux утилита top показывает загрузку CPU в процентах от одного логического ядра. Значение 100% означает полную загрузку одного ядра. ClickHouse — многопоточная СУБД, которая может параллельно использовать несколько ядер для выполнения одного запроса. Поэтому 385.2% означает, что полностью загружены 3 ядра и ещё одно загружено на 85%. Если на сервере 8 ядер, то используется примерно 48% вычислительной мощности."     // Л. Толстой
            },
            {
                text: "Ситуация: Вы проверили статистику дисковой подсистемы через iostat -x. Для диска, на котором хранятся данные ClickHouse, вы увидели следующие показатели: утилизация диска (%util) составляет 98.9%, а среднее время отклика (await) — 45.67 мс. Вопрос: Какой вывод можно сделать о состоянии дисковой подсистемы?",
                options: [
                    "Диск работает в штатном режиме, нагрузка оптимальна.",
                    "Диск перегружен, время отклика слишком высокое для современной СУБД.",
                    "Необходимо увеличить количество операций чтения.",
                    "Необходимо отключить кэширование записи.",
                ],
                correct: 1,
                explanation: "Объяснение: Утилизация 98.9% означает, что диск практически постоянно занят обработкой запросов (очередь не успевает обрабатываться). Время отклика 45.67 мс является очень высоким показателем. Для NVMe SSD норма — менее 1 мс, для SATA SSD — менее 5 мс, для HDD — менее 10 мс. Такое значение указывает на то, что диск не справляется с нагрузкой, что напрямую тормозит работу ClickHouse. Рекомендуется перенести данные на быстрые NVMe накопители."      // 12
            }/*
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
