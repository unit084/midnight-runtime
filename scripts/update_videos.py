#!/usr/bin/env python3
"""Refresh data/videos.json from the public YouTube RSS feed (no API key).

- adds new long videos (Shorts are skipped), keeps older ones the feed no longer lists
- keeps fields edited by hand (e.g. "min", "tracks", "name")
- downloads a thumbnail for new videos into assets/thumbs/yt/<id>.jpg
Prints changed=true/false for the workflow.
"""
import json, os, re, sys, urllib.request, xml.etree.ElementTree as ET

CHANNEL_ID = 'UCmxDHdGcmp47C7ST_k_3B7A'
FEED = f'https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'videos.json')
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


def main():
    try:
        with open(DATA, encoding='utf-8') as f:
            videos = json.load(f)
    except FileNotFoundError:
        videos = []
    by_id = {v['id']: v for v in videos}
    before = json.dumps(videos, sort_keys=True)

    root = ET.fromstring(get(FEED))
    for e in root.findall('a:entry', NS):
        vid = e.find('yt:videoId', NS).text
        link = e.find('a:link', NS).get('href', '')
        if not ID_RE.match(vid or '') or '/shorts/' in link:
            continue
        title = (e.find('a:title', NS).text or '').strip()
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
        thumb = os.path.join(THUMBS, vid + '.jpg')
        if not os.path.exists(thumb):
            os.makedirs(THUMBS, exist_ok=True)
            for q in ('maxresdefault', 'hqdefault'):
                try:
                    data = get(f'https://i.ytimg.com/vi/{vid}/{q}.jpg')
                    if len(data) > 2000:
                        with open(thumb, 'wb') as f:
                            f.write(data)
                        break
                except Exception:
                    continue

    videos.sort(key=lambda v: v.get('date', ''), reverse=True)
    after = json.dumps(videos, sort_keys=True)
    if after != before:
        with open(DATA, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
            f.write('\n')
    changed = after != before
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
