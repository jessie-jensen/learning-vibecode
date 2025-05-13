from flask import Flask, render_template, request, jsonify
import os
import json
from collections import Counter

def get_cache_path(category):
    safe_cat = category.replace('/', '_').replace(' ', '_')
    cache_dir = os.path.join(os.path.dirname(__file__), '.cache')
    return os.path.join(cache_dir, f'{safe_cat}.json')

def get_freq_cache_path(category):
    safe_cat = category.replace('/', '_').replace(' ', '_')
    cache_dir = os.path.join(os.path.dirname(__file__), '.cache')
    return os.path.join(cache_dir, f'{safe_cat}_freq.json')

def compute_and_cache_word_freq(category, top_n=150):
    import importlib.util
    spec = importlib.util.spec_from_file_location("wiki_category_wordfreq", os.path.join(os.path.dirname(__file__), "wiki_category_wordfreq.py"))
    wiki_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(wiki_mod)
    path = get_cache_path(category)
    if not os.path.exists(path):
        return None
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    freq = Counter()
    for text in data['texts']:
        words = wiki_mod.tokenize(text)
        freq.update(words)
    top_words = dict(freq.most_common(top_n))
    freq_path = get_freq_cache_path(category)
    with open(freq_path, 'w', encoding='utf-8') as f:
        json.dump(top_words, f)
    return top_words

def load_word_freq(category, top_n=150):
    freq_path = get_freq_cache_path(category)
    if os.path.exists(freq_path):
        with open(freq_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    # If not cached, compute and cache
    return compute_and_cache_word_freq(category, top_n)

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/wordfreq')
def wordfreq():
    category = request.args.get('category', '')
    if not category:
        return jsonify({'error': 'No category provided'}), 400
    freq = load_word_freq(category, top_n=150)
    if freq is None:
        return jsonify({'error': f'No cache for category: {category}'}), 404
    return jsonify(freq)

if __name__ == '__main__':
    app.run(debug=True)
