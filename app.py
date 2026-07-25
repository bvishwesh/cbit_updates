import os
import re
import json
import time
import sqlite3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import requests
from bs4 import BeautifulSoup

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / 'frontend' / 'project' / 'dist'
TEMPLATES_DIR = BASE_DIR / 'templates'

DATABASE_PATH = os.environ.get('DATABASE_PATH', '/tmp/updates.db')
LOCK_DIR = os.environ.get('LOCK_DIR', '/tmp')

app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path='', template_folder=str(TEMPLATES_DIR))
app.secret_key = os.environ.get('FLASK_SECRET_KEY', os.urandom(24).hex())

EMAIL_ADDRESS = os.environ.get('EMAIL_ADDRESS', '')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', '')
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))

EMAIL_FILE = str(BASE_DIR / 'emails.txt')
LAST_UPDATES_FILE = str(BASE_DIR / 'last_updates.txt')


def get_db():
    db_dir = os.path.dirname(DATABASE_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA journal_mode=WAL')
    return conn


def init_db():
    try:
        conn = get_db()
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS subscribers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS updates_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL,
                fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[DB] init error: {e}")


def is_valid_email(email):
    return re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email) is not None


def scrape_college_updates():
    url = os.environ.get('SCRAPE_URL', 'https://www.cbit.ac.in/')
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        resp = requests.get(url, timeout=10, headers=headers)
        if resp.status_code != 200:
            return f"Error: status {resp.status_code}"
        soup = BeautifulSoup(resp.text, 'html.parser')
        container = (soup.find('marquee') or
                     soup.find('div', class_=['updates', 'news', 'notifications']) or
                     soup.find('ul', class_=['news-list', 'updates-list']))
        if container:
            items = [{'title': a.text.strip(), 'link': a.get('href')} for a in container.find_all('a') if a.text.strip()]
            return items if items else "No updates found"
        links = [(a.text.strip(), a.get('href')) for a in soup.find_all('a')[:20]]
        items = [{'title': t, 'link': h} for t, h in links if t and len(t) > 10 and h and 'cbit.ac.in' in str(h)]
        return items if items else "Could not find any updates on the homepage."
    except Exception as e:
        return f"Error during scraping: {e}"


def get_subscribers():
    try:
        conn = get_db()
        rows = conn.execute('SELECT email FROM subscribers').fetchall()
        conn.close()
        return [r['email'] for r in rows]
    except Exception:
        if os.path.exists(EMAIL_FILE):
            try:
                with open(EMAIL_FILE) as f:
                    return [l.strip() for l in f.read().splitlines() if l.strip()]
            except Exception:
                pass
    return []


def save_subscriber(email):
    if not is_valid_email(email):
        return False
    try:
        conn = get_db()
        conn.execute('INSERT OR IGNORE INTO subscribers (email) VALUES (?)', (email,))
        conn.commit()
        conn.close()
        return True
    except Exception:
        if not os.path.exists(EMAIL_FILE):
            open(EMAIL_FILE, 'a').close()
        try:
            with open(EMAIL_FILE, 'r+') as f:
                subs = [l.strip() for l in f.read().splitlines()]
                if email not in subs:
                    f.seek(0, 2)
                    f.write(f"{email}\n")
                    return True
        except Exception:
            pass
    return False


def send_email_notification(new_updates):
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        return
    try:
        subscribers = get_subscribers()
        if not subscribers:
            return
        body = ("Hello,\n\nNew updates from CBIT:\n\n" +
                "\n".join(f"- {u['title']}" for u in new_updates[:10]) +
                "\n\nhttps://www.cbit.ac.in/")
        msg = MIMEMultipart()
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = EMAIL_ADDRESS
        msg['Subject'] = "New Updates from CBIT Website!"
        msg.attach(MIMEText(body))
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.sendmail(EMAIL_ADDRESS, subscribers, msg.as_string())
        print(f"[EMAIL] sent to {len(subscribers)} subscribers")
    except Exception as e:
        print(f"[EMAIL] error: {e}")


def load_cached_updates():
    try:
        conn = get_db()
        row = conn.execute('SELECT data FROM updates_cache ORDER BY fetched_at DESC LIMIT 1').fetchone()
        conn.close()
        if row:
            return json.loads(row['data'])
    except Exception:
        pass
    if os.path.exists(LAST_UPDATES_FILE):
        try:
            with open(LAST_UPDATES_FILE, 'r') as f:
                raw = f.read().strip()
            if raw:
                import ast
                data = ast.literal_eval(raw)
                if isinstance(data, list):
                    return data
        except Exception:
            pass
    return []


def save_cached_updates(data):
    try:
        conn = get_db()
        conn.execute('DELETE FROM updates_cache')
        conn.execute('INSERT INTO updates_cache (data) VALUES (?)', (json.dumps(data),))
        conn.commit()
        conn.close()
    except Exception:
        try:
            with open(LAST_UPDATES_FILE, 'w') as f:
                f.write(str(data))
        except Exception:
            pass


def monitor_updates():
    current = scrape_college_updates()
    if not isinstance(current, list):
        return
    cached = load_cached_updates()
    if json.dumps(current, sort_keys=True) == json.dumps(cached, sort_keys=True):
        return
    print("[MONITOR] new updates detected!")
    send_email_notification(current)
    save_cached_updates(current)


def acquire_lock(name, ttl=300):
    lock_path = os.path.join(LOCK_DIR, f'{name}.lock')
    try:
        os.makedirs(LOCK_DIR, exist_ok=True)
        if os.path.exists(lock_path):
            age = time.time() - os.path.getmtime(lock_path)
            if age < ttl:
                return False
            os.remove(lock_path)
        with open(lock_path, 'x') as f:
            f.write(str(os.getpid()))
        return lock_path
    except FileExistsError:
        return False


def release_lock(lock_path):
    try:
        if lock_path and os.path.exists(lock_path):
            os.remove(lock_path)
    except Exception:
        pass


init_db()


@app.route('/')
@app.route('/home')
def home():
    updates = scrape_college_updates()
    if isinstance(updates, str):
        cached = load_cached_updates()
        if cached:
            flash('Showing cached updates (live fetch failed)', 'warning')
            updates = cached
        else:
            flash(updates, 'error')
            updates = []
    if STATIC_DIR.exists() and (STATIC_DIR / 'index.html').exists():
        return app.send_static_file('index.html')
    return render_template('index.html', updates=updates)


@app.route('/subscribe', methods=['GET', 'POST'])
def subscribe():
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        if email:
            if not is_valid_email(email):
                flash('Please enter a valid email address.', 'error')
            elif save_subscriber(email):
                flash('Subscribed successfully!', 'success')
            else:
                flash('Already subscribed or error occurred.', 'info')
            return redirect(url_for('home'))
    if STATIC_DIR.exists() and (STATIC_DIR / 'index.html').exists():
        return app.send_static_file('index.html')
    return render_template('subscribe.html')


@app.route('/api/updates')
def api_updates():
    updates = scrape_college_updates()
    if isinstance(updates, str):
        cached = load_cached_updates()
        if cached:
            return jsonify(cached)
        return jsonify({"error": updates}), 500
    return jsonify(updates)


@app.route('/api/subscribe', methods=['POST'])
def api_subscribe():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip()
    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not is_valid_email(email):
        return jsonify({"error": "Invalid email address"}), 400
    if save_subscriber(email):
        return jsonify({"message": "Subscribed"}), 201
    if email in get_subscribers():
        return jsonify({"message": "Already subscribed"}), 200
    return jsonify({"error": "Failed to subscribe"}), 500


@app.route('/api/cron/scrape')
def cron_scrape():
    lock = acquire_lock('scrape', ttl=1800)
    if not lock:
        return jsonify({"status": "skipped", "reason": "another worker ran recently"}), 200
    try:
        monitor_updates()
        return jsonify({"status": "ok"})
    finally:
        release_lock(lock)


@app.route('/health')
def health():
    return jsonify({"status": "ok"})


@app.route('/api/stats')
def api_stats():
    return jsonify({
        "subscribers": len(get_subscribers()),
        "cached_updates": len(load_cached_updates()),
        "email_configured": bool(EMAIL_ADDRESS and EMAIL_PASSWORD)
    })


@app.route('/<path:path>')
def serve_react(path):
    if STATIC_DIR.exists() and (STATIC_DIR / 'index.html').exists():
        return app.send_static_file('index.html')
    return redirect(url_for('home'))


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=bool(os.environ.get('DEBUG')))
