#!/usr/bin/env python3
"""公開の時刻を過ぎた動画を、サイトの「近日公開」から YouTube の埋め込みに差し替える。

assets/videos.json に {"NN": {"id": YouTube の動画ID, "at": 公開の時刻}} を書いておく。
時刻ちょうどの切り替えは、見た人のブラウザで assets/site.js がやる（GitHub の自動実行も Mac も要らない）。
これは、同じ切り替えを HTML そのものにも書き込む道具（検索エンジンや JS が切ってある人向け）。
計算ページへの入り口（data-gate="NN" hidden）と、計算ページの「公開と同時に使えるように」のお知らせも外す。
Claude がサイトを触るたびに動かして commit・push する。何度動かしても同じ結果になる（済んだ回は何も変えない）。

  python3 .github/scripts/publish_videos.py          # 時刻を過ぎた回だけ
  python3 .github/scripts/publish_videos.py --dry    # 書き換えずに、どの回が対象かだけ出す
"""
import datetime, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
COMMENT = '<!-- 公開したら YouTube の埋め込みに差し替える -->'


def iframe(vid, title):
    return (f'<iframe src="https://www.youtube-nocookie.com/embed/{vid}" title="{title}" loading="lazy" '
            'allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" '
            'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen '
            'style="display:block;width:100%;height:100%;border:0"></iframe>')


def edit(path, fn):
    p = ROOT / path
    old = p.read_text(encoding='utf-8')
    new = fn(old)
    if new != old:
        p.write_text(new, encoding='utf-8')
        print('  書き換え:', path)


def top(html, nn):
    # トップの動画の並び：その回のカードから「近日公開」の札を外す
    return re.sub(rf'(<a class="vid" href="douga/{nn}/">.*?)<span class="tag">近日公開</span>',
                  r'\1', html, count=1)


def douga_list(html, nn, vid):
    # 動画の一覧：その回のカードのサムネを埋め込みに、「近日公開」の札を外す
    m = re.search(rf'<li class="ep card" id="ep{nn}">.*?</li>', html, re.S)
    if not m:
        sys.exit(f'douga/index.html に ep{nn} が無い')
    block = m.group(0)
    n = int(nn)
    block = re.sub(rf'{re.escape(COMMENT)}\s*<img [^>]*>', iframe(vid, f'第{n}回の動画'), block)
    block = block.replace('<span class="tag tag-soon">近日公開</span>', '')
    return html[:m.start()] + block + html[m.end():]


def douga_page(html, nn, vid):
    # 文字版のページ：上の動画の場所を埋め込みに、下の一言を YouTube へのリンクに
    n = int(nn)
    html = re.sub(rf'{re.escape(COMMENT)}\s*(<div class="video__frame">)\s*<img [^>]*>\s*<span class="video__badge">[^<]*</span>',
                  lambda m: f'{m.group(1)}\n          {iframe(vid, f"第{n}回の動画")}', html, count=1)
    html = re.sub(r'<figcaption>動画はまだ公開していません。.*?</figcaption>',
                  f'<figcaption><a href="https://youtu.be/{vid}" target="_blank" rel="noopener">YouTube で見る</a></figcaption>',
                  html, count=1, flags=re.S)
    return html


def ungate(html, nn):
    # 計算ページへの入り口を出し、計算ページのお知らせを消す
    html = html.replace(f'data-gate="{nn}" hidden', f'data-gate="{nn}"')
    return re.sub(rf'<main id="main" data-gate="{nn}" data-soon>\s*<div class="wrap soon-note">.*?</div><!-- /soon-note -->',
                  '<main id="main">', html, count=1, flags=re.S)


def main():
    dry = '--dry' in sys.argv
    now = datetime.datetime.now(datetime.timezone.utc)
    videos = json.loads((ROOT / 'assets' / 'videos.json').read_text(encoding='utf-8'))
    for nn, v in sorted(videos.items()):
        at = datetime.datetime.fromisoformat(v['at'])
        if at > now:
            print(f'{nn}: まだ（{v["at"]}）')
            continue
        print(f'{nn}: 公開済み → 反映')
        if dry:
            continue
        edit('index.html', lambda h: top(h, nn))
        edit('douga/index.html', lambda h: douga_list(h, nn, v['id']))
        edit(f'douga/{nn}/index.html', lambda h: douga_page(h, nn, v['id']))
        for p in sorted(ROOT.glob('**/index.html')):
            if f'data-gate="{nn}"' in p.read_text(encoding='utf-8'):
                edit(str(p.relative_to(ROOT)), lambda h: ungate(h, nn))


if __name__ == '__main__':
    main()
