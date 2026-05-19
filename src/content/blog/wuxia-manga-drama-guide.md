---
title: "用 AI 制作武侠漫剧：从小说文本到带背景音乐的短视频"
date: 2026-05-20
description: "一套完整工作流：武侠文本 → AI 分镜脚本 → Stable Diffusion 生图 → Python 合成 MP4 漫剧，全程本地运行。"
tags: ["AI创作", "武侠", "Python", "Stable Diffusion"]
---

> 一套完整的工作流：武侠文本 → AI 分镜脚本 → Stable Diffusion 生图 → Python 合成 MP4 漫剧。

---

## 起点：一段武侠文字

原始素材是这样一段武侠小说片段：

> 世界太大，每个人的圈子太小，我的眼睛局限在自己的圈子内从不往外细看。我一直以为凭自己的修为，在江湖中能对我造成生命威胁的人就那么为数不多的小部分人。原来在我所看到的圈子外，还有很多我所无法想象的高手存在。我会再去找你的，你等着，使武当绕指柔剑的高明少年。天龙神飘然从城内门派高手排行榜中走过，此时排行榜上，全真十大高手天龙神的名字已然被替换。创造一个名字需要付出无数，但毁灭它，往往只需要一个眨眼的瞬间……可是就算辛苦，我是天龙神，我决计不容许自己就此沉没！

这段文字有明确的情绪弧线：**从自我局限的认知，到名字被抹除的耻辱，再到绝地反击的宣言**。非常适合改编为漫剧。

---

## 第一步：生成分镜脚本

用 AI 将小说文本拆解为 10 个镜头，每个镜头包含：景别、英文生图 Prompt、台词/旁白。

| 镜号 | 景别 | 台词 / 旁白 |
|------|------|------------|
| 01 | 远景·城门黄昏 | 世界太大，每个人的圈子太小…… |
| 02 | 全景·江湖人群 | 我一直以为，能对我造成生命威胁的，不过寥寥数人。 |
| 03 | 中景·排行榜木牌 | 然而—— |
| 04 | 特写·名字被替换 | 全真十大高手，天龙神之名，已然不复存在。 |
| 05 | 特写·天龙神面部 | （静默镜头） |
| 06 | 中景·转身离去 | 创造一个名字，需要付出无数；毁灭它，往往只需一个眨眼。 |
| 07 | 远景·少年剑客幻影 | 使武当绕指柔剑的高明少年—— |
| 08 | 中景·抬头宣誓 | 我会再去找你的。你等着。 |
| 09 | 特写·握拳 | 为此辛苦着，可就算辛苦—— |
| 10 | 全景仰拍·英雄立像 | 我是天龙神。我决计——不容许自己就此沉没！ |

### 视觉风格关键词

所有图片统一附加：

```
guofeng ink wash painting, Chinese wuxia comic style,
traditional Chinese architecture, dramatic chiaroscuro lighting,
calligraphy brushstroke texture, cinematic panel composition,
monochrome with selective red accent, highly detailed, masterpiece
```

---

## 第二步：用 Stable Diffusion 生图

每个分镜对应一张 768×1024（3:4）竖版图片，命名为 `panel_01.png` ～ `panel_10.png`。

**推荐配置：**
- 模型：GuoFeng3 / 国风3，或 Anything V5 + 国风 LoRA
- 采样器：DPM++ 2M Karras
- 步数：28–35，CFG：7–8

以第 10 镜（高潮镜头）为例，生图 Prompt 是：

```
Epic low-angle full shot of Tianlong Shen standing tall against
massive ancient city gate, full moon emerging dramatically from
dark clouds above, his black-robed silhouette powerful and
resolute, massive ink splash eruption around figure like
exploding calligraphy, long sword raised slightly, lone hero
ultimate determination shot, epic climax panel composition,
moon back-lighting, wuxia pride and fury,
guofeng ink wash painting, Chinese wuxia comic style...
```

---

## 第三步：Python 自动合成视频

核心工具：`moviepy` + `Pillow`

### 项目结构

```
manga_drama/
├── build_video.py    ← 主合成脚本
├── sd_prompts.txt    ← 10 个分镜的 SD 提示词
├── bgm.mp3           ← 国风背景音乐
└── panels/
    ├── panel_01.png
    ├── ...
    └── panel_10.png
```

### 安装依赖

```bash
pip install "moviepy==1.0.3" pillow numpy
```

### 核心合成逻辑

**1. 图片等比缩放裁剪**

```python
def load_panel(path):
    img = Image.open(path).convert("RGB")
    scale = max(W / img.width, H / img.height)
    img = img.resize((int(img.width*scale), int(img.height*scale)), Image.LANCZOS)
    left = (img.width - W) // 2
    top  = (img.height - H) // 2
    return np.array(img.crop((left, top, left+W, top+H)))
```

**2. 逐字出现的字幕动画**

旁白和台词分两种样式，字幕按 0.13 秒/字 的节奏逐字出现：

```python
elapsed     = max(0.0, t - 0.4)          # 开场延迟 0.4s
chars_shown = int(elapsed / 0.13) + 1
visible     = text[:chars_shown]
```

台词用**金黄色 + 描边边框**，旁白用**灰白色无边框**，两种样式清晰区分叙事层次。

**3. 淡入淡出过渡**

每个镜头自带 0.7s 淡入淡出，拼接后形成自然的页面翻转感：

```python
clip = vfx.fadein(clip, 0.7)
clip = vfx.fadeout(clip, 0.7)
final = concatenate_videoclips(clips, method="compose")
```

**4. BGM 自动循环 + 淡出**

```python
if audio.duration < total:
    loops = int(total / audio.duration) + 2
    audio = concatenate_audioclips([audio] * loops)
audio = audio.subclip(0, total).audio_fadeout(3.0)
```

### 运行

```bash
cd manga_drama
python build_video.py
```

渲染完成后输出 `tianlong_shen.mp4`，总时长约 **100 秒**，分辨率 **1080×1440**。

---

## 第四步：获取国风 BGM

推荐三个免费来源：

| 平台 | 方式 | 推荐关键词 |
|------|------|-----------|
| [Pixabay Music](https://pixabay.com/music/search/chinese+traditional/) | 免费下载，可商用 | guqin / erhu / wuxia |
| [爱给网](https://www.aigei.com/music/class/guqin/) | 免费，中文界面 | 古琴 / 琵琶 / 二胡 |
| [Suno AI](https://suno.com) | AI 生成，免费额度 | `ancient Chinese guqin wuxia drama melancholy instrumental` |

---

## 效果说明

最终输出的漫剧效果：

- 10 个分镜按顺序切换，淡入淡出过渡
- 每张图停留 6–14 秒，字幕逐字出现
- 底部配有旁白/台词，金色边框区分台词
- 全程国风古琴/古筝 BGM，结尾音乐淡出

整个工作流从文本到成片，熟练后大约 **2–3 小时**（主要时间在 SD 生图）。

---

*谷瑞，2026 年 5 月 20 日*
