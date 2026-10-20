window.Views = window.Views || {};

Views['admin.broadcast'] = async function (box) {
  const esc = UI.esc;
  const s = await api('/api/admin/settings');

  const opts = [['all', 'All users'], ['active7', 'Active in the last 7 days']]
    .concat(s.levels.map((l) => ['level:' + l.level, 'Level ' + l.level + ' – ' + l.name]));

  box.innerHTML =
    '<div class="h1">📣 Broadcast</div>'
    + '<div class="card">'
    + '<label class="label">Audience</label><select class="input" id="bc-aud">'
    + opts.map((o) => '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>').join('') + '</select>'
    + '<label class="label">Message</label><textarea class="input" id="bc-text" maxlength="3500" placeholder="Write your message..."></textarea>'
    + '<label class="label">Button text (optional)</label><input class="input" id="bc-btn" maxlength="60">'
    + '<label class="label">Button link (optional)</label><input class="input" id="bc-url" placeholder="https://...">'
    + '<button class="btn block mt" id="bc-send">Send broadcast</button>'
    + '<div class="note" id="bc-status"></div></div>'
    + '<div class="small muted">Only users who have notifications on and are not banned will receive it.</div>';

  const btn = box.querySelector('#bc-send');
  const statusEl = box.querySelector('#bc-status');
  let timer = null;

  async function poll() {
    if (!document.body.contains(statusEl)) { clearInterval(timer); return; }
    try {
      const st = await api('/api/admin/broadcast/status');
      statusEl.textContent = (st.running ? 'Sending... ' : 'Finished. ') + st.sent + ' sent, ' + st.failed + ' failed, ' + st.total + ' total';
      if (!st.running) {
        clearInterval(timer);
        btn.disabled = false;
      }
    } catch (e) { /* ignore */ }
  }

  btn.onclick = async () => {
    const text = box.querySelector('#bc-text').value.trim();
    if (!text) return UI.toast('Write a message first', 'bad');
    const yes = await UI.confirmBox('Send this broadcast?', 'It cannot be undone.', 'Send');
    if (!yes) return;
    btn.disabled = true;
    try {
      const r = await api('/api/admin/broadcast', {
        method: 'POST',
        body: {
          text: text,
          audience: box.querySelector('#bc-aud').value,
          buttonText: box.querySelector('#bc-btn').value,
          buttonUrl: box.querySelector('#bc-url').value
        }
      });
      statusEl.textContent = 'Queued for ' + r.queued + ' users...';
      clearInterval(timer);
      timer = setInterval(poll, 2000);
    } catch (e) {
      btn.disabled = false;
      UI.toast(e.message, 'bad');
    }
  };
};
