import sys
import requests
import string
import os
import json
from collections import Counter

# List of common English stopwords
STOPWORDS = set([
    'the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'that', 'as', 'for', 'with', 'on', 'was', 'by', 'an', 'be', 'are',
    'this', 'which', 'or', 'from', 'at', 'his', 'he', 'but', 'not', 'have', 'has', 'had', 'they', 'you', 'were', 'their',
    'one', 'all', 'we', 'can', 'her', 'there', 'been', 'if', 'more', 'will', 'would', 'about', 'who', 'when', 'so', 'no',
    'out', 'up', 'what', 'some', 'do', 'into', 'than', 'could', 'other', 'them', 'she', 'my', 'me', 'your', 'its', 'our',
    'also', 'may', 'these', 'such', 'any', 'over', 'new', 'after', 'first', 'two', 'like', 'time', 'only', 'then', 'now',
    'did', 'how', 'many', 'most', 'just', 'him', 'see', 'because', 'us', 'even', 'use', 'used', 'using', 'where', 'between'
])

API_URL = "https://en.wikipedia.org/w/api.php"

def get_category_members(category):
    members = []
    cmcontinue = None
    while True:
        params = {
            'action': 'query',
            'list': 'categorymembers',
            'cmtitle': f'Category:{category}',
            'cmlimit': '500',
            'format': 'json',
        }
        if cmcontinue:
            params['cmcontinue'] = cmcontinue
        resp = requests.get(API_URL, params=params)
        data = resp.json()
        members.extend([page['title'] for page in data['query']['categorymembers'] if page['ns'] == 0])
        if 'continue' in data:
            cmcontinue = data['continue']['cmcontinue']
        else:
            break
    return members

def get_page_text(title):
    params = {
        'action': 'query',
        'prop': 'extracts',
        'titles': title,
        'format': 'json',
        'explaintext': 1,
    }
    resp = requests.get(API_URL, params=params)
    data = resp.json()
    pages = data['query']['pages']
    for pageid in pages:
        return pages[pageid].get('extract', '')
    return ''

def get_category_cache_path(category):
    safe_cat = category.replace('/', '_').replace(' ', '_')
    cache_dir = os.path.join(os.path.dirname(__file__), '.cache')
    os.makedirs(cache_dir, exist_ok=True)
    return os.path.join(cache_dir, f'{safe_cat}.json')

def load_cache(category):
    cache_path = get_category_cache_path(category)
    if os.path.exists(cache_path):
        with open(cache_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def save_cache(category, titles, texts):
    cache_path = get_category_cache_path(category)
    with open(cache_path, 'w', encoding='utf-8') as f:
        json.dump({'titles': titles, 'texts': texts}, f)

def tokenize(text):
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    words = text.split()
    return [w for w in words if w.isalpha() and w not in STOPWORDS]

def main():
    if len(sys.argv) != 2:
        print("Usage: python wiki_category_wordfreq.py <Wikipedia Category>")
        sys.exit(1)
    category = sys.argv[1]
    cache = load_cache(category)
    if cache is None:
        print(f"Cache not found. Fetching pages in category: {category}")
        titles = get_category_members(category)
        print(f"Found {len(titles)} pages. Fetching content and computing frequencies...")
        texts = []
        for i, title in enumerate(titles):
            print(f"[{i+1}/{len(titles)}] Processing: {title}", file=sys.stderr)
            text = get_page_text(title)
            texts.append(text)
        save_cache(category, titles, texts)
        cache = {'titles': titles, 'texts': texts}
    else:
        print(f"Loaded category '{category}' from cache.")
    titles = cache['titles']
    texts = cache['texts']
    freq = Counter()
    for text in texts:
        words = tokenize(text)
        freq.update(words)
    print("\nWord frequencies (non-common words):")
    for word, count in freq.most_common(100):
        if count > 100:
            print(f"{word}\t{count}")

if __name__ == "__main__":
    main()
