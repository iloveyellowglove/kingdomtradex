(function() {
    const style = document.createElement('style');
    style.textContent = `
        #ephod-bubble {
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            width: 60px; height: 60px; border-radius: 50%;
            background: linear-gradient(135deg, #FFD700, #B8860B);
            border: 3px solid #6A0DAD; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font-size: 28px; box-shadow: 0 4px 16px rgba(106, 13, 173, 0.5);
            transition: transform 0.2s;
        }
        #ephod-bubble:hover { transform: scale(1.1); }
        #ephod-window {
            position: fixed; bottom: 90px; right: 20px; z-index: 9999;
            width: 340px; height: 440px; display: none; flex-direction: column;
            background: #1a1a2e; border: 2px solid #FFD700; border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5); overflow: hidden;
        }
        #ephod-window.open { display: flex; }
        #ephod-header {
            background: linear-gradient(135deg, #4B0082, #6A0DAD);
            color: #FFD700; padding: 12px 16px; font-weight: bold;
            display: flex; justify-content: space-between; align-items: center;
        }
        #ephod-header small { color: #FFD700; opacity: 0.8; font-weight: normal; }
        #ephod-close { background: none; border: none; color: #FFD700; font-size: 20px; cursor: pointer; }
        #ephod-messages {
            flex: 1; overflow-y: auto; padding: 12px;
            display: flex; flex-direction: column; gap: 8px;
        }
        .ephod-msg { padding: 10px 14px; border-radius: 12px; max-width: 85%; font-size: 14px; line-height: 1.4; }
        .ephod-msg.user { background: #6A0DAD; color: white; align-self: flex-end; }
        .ephod-msg.oracle { background: #2d1f00; color: #FFD700; align-self: flex-start; border: 1px solid #B8860B; }
        #ephod-input-area { display: flex; padding: 10px; gap: 8px; border-top: 1px solid #333; }
        #ephod-input {
            flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #6A0DAD;
            background: #2a2a3e; color: #FFD700; font-size: 14px;
        }
        #ephod-input::placeholder { color: #888; }
        #ephod-send {
            background: linear-gradient(135deg, #FFD700, #B8860B);
            color: #000; border: none; border-radius: 8px; padding: 10px 16px;
            font-weight: bold; cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    const bubble = document.createElement('div');
    bubble.id = 'ephod-bubble';
    bubble.innerHTML = '🔥';
    bubble.title = 'The Ephod - Your AI High Priest';
    document.body.appendChild(bubble);

    const win = document.createElement('div');
    win.id = 'ephod-window';
    win.innerHTML = `
        <div id="ephod-header">
            <span>🔥 The Ephod <small>- Your AI High Priest</small></span>
            <button id="ephod-close">&times;</button>
        </div>
        <div id="ephod-messages">
            <div class="ephod-msg oracle">Welcome, faithful steward. Ask me for divine trading wisdom.</div>
        </div>
        <div id="ephod-input-area">
            <input id="ephod-input" placeholder="Ask the Oracle..." maxlength="200">
            <button id="ephod-send">Ask</button>
        </div>
    `;
    document.body.appendChild(win);

    bubble.addEventListener('click', function() {
        win.classList.toggle('open');
    });

    document.getElementById('ephod-close').addEventListener('click', function() {
        win.classList.remove('open');
    });

    function addMessage(text, cls) {
        var msgs = document.getElementById('ephod-messages');
        var div = document.createElement('div');
        div.className = 'ephod-msg ' + cls;
        div.textContent = text;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
    }

    function sendMessage() {
        var input = document.getElementById('ephod-input');
        var text = input.value.trim();
        if (!text) return;
        addMessage(text, 'user');
        input.value = '';

        addMessage('The Ephod is consulting the Most High...', 'oracle');

        fetch('/api/oracle.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ message: text })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            addMessage(data.oracle, 'oracle');
        })
        .catch(function() {
            addMessage('The Oracle is in prayer. Try again, faithful steward.', 'oracle');
        });
    }

    document.getElementById('ephod-send').addEventListener('click', sendMessage);
    document.getElementById('ephod-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
})();
