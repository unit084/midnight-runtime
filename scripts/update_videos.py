#!/usr/bin/env python3
"""Refresh data/videos.json from the public YouTube RSS feed (no API key).

- adds new long videos (Shorts and the 24/7 live radio are skipped), keeps older ones the feed no longer lists
- removes live-radio entries ("24/7" in the title); the live is reached via the Live button
- keeps fields edited by hand (e.g. "min", "tracks", "name")
- downloads a thumbnail for new videos into assets/thumbs/yt/<id>.jpg
- also downloads thumbnails for announced premieres (data/upcoming.json entries with an "id"),
  so a new premiere only needs a JSON edit; premieres that have not started yet are not added as videos
Prints changed=true/false for the workflow.
"""
import json, os, re, sys, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone

CHANNEL_ID = 'UCmxDHdGcmp47C7ST_k_3B7A'
FEED = f'https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'videos.json')
UPCOMING = os.path.join(ROOT, 'data', 'upcoming.json')
THUMBS = os.path.join(ROOT, 'assets', 'thumbs', 'yt')
NS = {'a': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}
ID_RE = re.compile(r'^[A-Za-z0-9_-]{11}$')
UA = {'User-Agent': 'Mozilla/5.0 (midnight-runtime site updater)'}


def get(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def minutes(title):
    m = re.search(r'(\d{2,3})\s*[- ]?\s*min', title, re.I)
    return int(m.group(1)) if m else None


def is_live(title):
    return '24/7' in title


def save_thumb(vid):
    """Download i.ytimg.com/vi/<id> once; only real JPEG files are kept. Returns True if a file was added."""
    if not ID_RE.match(vid or ''):
        return False
    thumb = os.path.join(THUMBS, vid + '.jpg')
    if os.path.exists(thumb):
        return False
    os.makedirs(THUMBS, exist_ok=True)
    for q in ('maxresdefault', 'hqdefault'):
        try:
            data = get(f'https://i.ytimg.com/vi/{vid}/{q}.jpg')
        except Exception:
            continue
        if len(data) > 2000 and data[:3] == b'\xff\xd8\xff':
            with open(thumb, 'wb') as f:
                f.write(data)
            return True
    return False


def load_upcoming():
    try:
        with open(UPCOMING, encoding='utf-8') as f:
            items = json.load(f)
    except (FileNotFoundError, ValueError):
        return []
    return [u for u in items if isinstance(u, dict)] if isinstance(items, list) else []


def not_started(u):
    try:
        return datetime.fromisoformat(str(u.get('premiere', ''))) > datetime.now(timezone.utc)
    except ValueError:
        return False


def main():
    try:
        with open(DATA, encoding='utf-8') as f:
            videos = json.load(f)
    except FileNotFoundError:
        videos = []
    before = json.dumps(videos, sort_keys=True)
    videos = [v for v in videos if not is_live(v.get('title', ''))]
    by_id = {v['id']: v for v in videos}
    upcoming = load_upcoming()
    soon = {u.get('id') for u in upcoming if not_started(u)}
    new_thumbs = False
    for u in upcoming:
        if save_thumb(str(u.get('id', ''))):
            new_thumbs = True

    try:
        entries = ET.fromstring(get(FEED)).findall('a:entry', NS)
    except Exception as exc:  # never break the deploy because YouTube hiccuped
        print('YouTube feed skipped:', exc, file=sys.stderr)
        entries = []
    for e in entries:
        vid = e.find('yt:videoId', NS).text
        link = e.find('a:link', NS).get('href', '')
        if not ID_RE.match(vid or '') or '/shorts/' in link:
            continue
        title = (e.find('a:title', NS).text or '').strip()
        if is_live(title) or vid in soon:
            continue
        published = e.find('a:published', NS).text[:10]
        v = by_id.get(vid)
        if v is None:
            v = {'id': vid, 'title': title, 'date': published}
            mins = minutes(title)
            if mins:
                v['min'] = mins
            videos.append(v)
            by_id[vid] = v
        else:
            v['title'] = title
        if save_thumb(vid):
            new_thumbs = True

    videos.sort(key=lambda v: v.get('date', ''), reverse=True)
    after = json.dumps(videos, sort_keys=True)
    if after != before:
        with open(DATA, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
            f.write('\n')
    changed = after != before or new_thumbs
    print(f'changed={"true" if changed else "false"}')
    out = os.environ.get('GITHUB_OUTPUT')
    if out:
        with open(out, 'a') as f:
            f.write(f'changed={"true" if changed else "false"}\n')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:  # never break the deploy because YouTube hiccuped
        print('YouTube update skipped:', exc, file=sys.stderr)
        out = os.environ.get('GITHUB_OUTPUT')
        if out:
            with open(out, 'a') as f:
                f.write('changed=false\n')
