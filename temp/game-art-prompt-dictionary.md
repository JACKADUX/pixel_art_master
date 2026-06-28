# 🎮 游戏美术风格 Prompt 字典

> AI 生图专用 · 游戏类别 × 美术风格 × 关键词组合工具
> 适用：Midjourney / Stable Diffusion / ComfyUI / DALL·E / GPT Image

---

## 📖 使用说明

本字典分四层结构：

1. **游戏类别** → 定义画面内容（有什么）
2. **美术风格** → 定义视觉语言（长什么样）
3. **氛围关键词** → 定义情绪光色（什么感觉）
4. **技术参数** → 定义画质细节（多清晰）

**组合公式：**
```
[游戏类别 Prompt] + [美术风格 Prompt] + [氛围关键词] + [技术参数]
```

---

## 一、游戏类别大全

### 🗡️ 动作 / 战斗

| 类别 | 英文 | 典型画面元素 | 核心 Prompt |
|------|------|-------------|-------------|
| 平台跳跃 | Platformer | 多层平台、可收集物、陷阱、卡通角色 | `side-scrolling platformer game screenshot, floating platforms, collectibles, vibrant background layers` |
| 横版动作 | Side-scroller Action | 连击特效、Boss战、格斗姿态 | `2D side-scrolling action game, dynamic combat pose, slash effects, epic boss in background` |
| 清版过关 | Beat 'em Up | 街头场景、多人混战、击飞效果 | `arcade beat em up game, street fight scene, multiple enemies, impact frame` |
| 类银河城 | Metroidvania | 迷宫地图、能力解锁、黑暗洞穴 | `metroidvania game, interconnected map, dark atmospheric caves, ability-gated passages` |
| 类魂 | Soulslike | 废墟建筑、巨大Boss、黑暗奇幻 | `soulslike game screenshot, ruined gothic architecture, giant monstrous boss, fog atmosphere` |
| 类肉鸽 | Roguelike/Roguelite | 随机地牢、道具图标、像素顶视 | `top-down roguelike dungeon, procedurally generated rooms, item pickups, pixel art` |
| 无双割草 | Musou / Warriors | 大军战场、一人敌千、华丽特效 | `musou game, one warrior versus massive army, flashy special effects, battlefield chaos` |
| 格斗 | Fighting Game | 1v1对峙、血条UI、格斗场景 | `2D fighting game, versus screen, two fighters facing off, health bars, dramatic lighting` |

### 🔫 射击

| 类别 | 英文 | 典型画面元素 | 核心 Prompt |
|------|------|-------------|-------------|
| FPS | First-Person Shooter | 持枪手臂、HUD准星、战场环境 | `first-person shooter, weapon viewmodel, crosshair HUD, military environment` |
| TPS | Third-Person Shooter | 掩体射击、越肩视角、战术动作 | `third-person shooter, over-the-shoulder aiming, cover-based combat, tactical pose` |
| 弹幕 | Bullet Hell / Shmup | 密集弹幕、小判定点、竖屏/横屏 | `bullet hell shmup, dense bullet patterns, small player hitbox, vertical scrolling screen` |
| 英雄射击 | Hero Shooter | 技能特效、多角色、竞技场 | `hero shooter game, character abilities, colorful skill effects, arena map` |
| 战术射击 | Tactical Shooter | 小队配合、破门、夜视镜 | `tactical shooter, squad breach and clear, night vision goggles, realistic military gear` |
| 大逃杀 | Battle Royale | 空投、缩圈、大地图 | `battle royale, airdrop falling, shrinking safe zone, large open map, last survivors` |

### 🏰 RPG

| 类别 | 英文 | 典型画面元素 | 核心 Prompt |
|------|------|-------------|-------------|
| JRPG | Japanese RPG | 四人小队、菜单指令、幻想世界 | `JRPG battle scene, four-person party in a row, menu command UI, fantasy landscape background` |
| CRPG | Computer RPG | 等距视角、对话树、小队管理 | `isometric CRPG, dialogue tree UI, party management screen, detailed fantasy map` |
| ARPG | Action RPG | 暗黑式刷宝、技能树、地牢 | `action RPG, isometric loot explosion, skill tree UI, dark dungeon corridors` |
| MMORPG | MMO | 多人场景、公会、副本Boss | `MMORPG screenshot, raid boss encounter, many players casting spells, epic scale` |
| TRPG / SRPG | Tactical/Strategy RPG | 网格战场、棋盘式移动、兵种 | `tactical RPG, grid-based battlefield, chess-like movement, character classes in formation` |
| 开放世界 | Open World RPG | 远景地标、地图UI、探索感 | `open world RPG, distant landmark visible, minimap UI, adventurer overlooking vast landscape` |
| 武侠 RPG | Wuxia RPG | 古风建筑、轻功飞行、剑气 | `wuxia RPG, ancient Chinese architecture, warrior leaping through bamboo forest, sword energy trails` |
| 修仙 RPG | Xianxia / Cultivation | 仙气缭绕、法宝、渡劫天雷 | `xianxia cultivation game, immortal floating in clouds, glowing spiritual treasure, heavenly tribulation lightning` |

### 🧩 策略 / 模拟

| 类别 | 英文 | 典型画面元素 | 核心 Prompt |
|------|------|-------------|-------------|
| RTS | Real-Time Strategy | 俯视战场、基地建设、单位群 | `real-time strategy game, top-down base building, unit armies clashing, resource gathering` |
| 回合制策略 | Turn-Based Strategy | 六角格、兵牌、大地图 | `turn-based strategy, hex grid map, unit counters on tiles, grand strategy overview` |
| 塔防 | Tower Defense | 路径迷宫、防御塔、敌人波次 | `tower defense game, maze of defensive towers, enemy waves following path, colorful projectiles` |
| 卡牌 | Card Game | 手牌、战场盘面、卡牌美术 | `digital card game, hand of cards fanned out, battlefield board, ornate card frame art` |
| 自走棋 | Auto Battler / Auto Chess | 棋盘格、棋子单位、羁绊UI | `auto chess game, checkerboard battlefield, miniature champion units, synergy trait UI` |
| 城建 | City Builder | 俯瞰城市、道路网格、资源UI | `city builder game, top-down growing city, road grid layout, population and resource UI panels` |
| 殖民模拟 | Colony Sim | 小人工作、物资管理、生存 | `colony sim, tiny colonists working, stockpile of resources, survival base building, rim lighting` |
| 大战略 | Grand Strategy | 世界地图、兵棋推演、外交面板 | `grand strategy game, world map with borders, military divisions, diplomatic interface` |
| 上帝模拟 | God Game | 地形改造、信徒、神力特效 | `god game, terraforming land, worshipping followers, divine power effects from the sky` |

### 🎨 冒险 / 叙事

| 类别 | 英文 | 典型画面元素 | 核心 Prompt |
|------|------|-------------|-------------|
| 点击冒险 | Point-and-Click | 静态场景、物品交互、对话 | `point-and-click adventure, beautifully painted static scene, interactive objects highlighted, dialogue portrait` |
| 视觉小说 | Visual Novel | 立绘、对话框、背景CG | `visual novel, character sprite standing, text box with dialogue, beautifully illustrated background CG` |
| 步行模拟 | Walking Simulator | 第一人称、环境叙事、氛围 | `walking simulator, first-person view, environmental storytelling, atmospheric abandoned place` |
| 互动电影 | Interactive Drama | 电影化镜头、QTE提示、角色近景 | `interactive drama game, cinematic camera angle, quick-time event prompt, close-up emotional character` |
| 解谜 | Puzzle Game | 机关装置、线索提示、抽象空间 | `puzzle game, intricate mechanical contraption, subtle visual clues, abstract geometric environment` |
| 密室逃脱 | Escape Room | 封闭房间、找钥匙、密码锁 | `escape room game, locked room filled with clues, combination lock, hidden compartment` |
| 恐怖冒险 | Horror Adventure | 手电筒、黑暗走廊、心理恐惧 | `survival horror game, flashlight beam in darkness, creepy corridor, psychological dread, fixed camera angle` |

### 🏎️ 竞速 / 体育

| 类别 | 英文 | 典型画面元素 | 核心 Prompt |
|------|------|-------------|-------------|
| 模拟赛车 | Racing Sim | 座舱视角、赛道、仪表盘 | `racing simulator, cockpit view, detailed dashboard, realistic race track, motion blur` |
| 街机赛车 | Arcade Racing | 第三人车尾、氮气加速、炫光 | `arcade racing game, third-person behind car, nitro boost effects, neon city streets` |
| 卡丁车 | Kart Racing | Q版角色、道具箱、欢乐赛道 | `kart racing game, cute chibi characters in karts, item boxes, colorful whimsical track` |
| 体育模拟 | Sports Sim | 球场、球员、真实比例 | `sports game, realistic stadium, players in action, broadcast camera angle, dramatic sports moment` |
| 极限运动 | Extreme Sports | 滑板/滑雪、特技动作、街头 | `extreme sports game, skateboarder doing trick mid-air, urban environment, dynamic angle, graffiti` |

### ⛏️ 沙盒 / 生存

| 类别 | 英文 | 典型画面元素 | 核心 Prompt |
|------|------|-------------|-------------|
| 沙盒创造 | Sandbox / Creative | 方块世界、自由建造、像素化 | `sandbox building game, block-based world, player-built structure, procedurally generated terrain` |
| 生存建造 | Survival Crafting | 工具UI、建造菜单、荒野 | `survival crafting game, inventory and crafting UI, wooden shelter being built, wilderness landscape` |
| 开放世界生存 | Open World Survival | 废墟探索、资源采集、昼夜 | `open world survival, post-apocalyptic ruins, collecting resources, day-night cycle atmosphere` |
| 种田模拟 | Farming Sim | 农田、牧场、温馨村庄 | `farming simulation game, crop fields, cute animals, cozy village, seasonal colors` |
| 太空沙盒 | Space Sandbox | 宇宙舰船、星球、空间站 | `space sandbox game, spaceship in orbit, planet in background, space station docking` |

### 🎵 节奏 / 音游

| 类别 | 英文 | 典型画面元素 | 核心 Prompt |
|------|------|-------------|-------------|
| 下落式音游 | Rhythm Game (VSRG) | 轨道音符、判定线、BGA背景 | `rhythm game, falling notes on lanes, judgment line, animated background visuals, music reactive` |
| 移动端音游 | Mobile Rhythm | 圆形/滑条音符、角色插画 | `mobile rhythm game, circular tap notes, anime-style character illustration, colorful UI effects` |

### 🔮 其他特色

| 类别 | 英文 | 典型画面元素 | 核心 Prompt |
|------|------|-------------|-------------|
| 银河恶魔城 | Metroid-like | 科幻洞穴、能力装甲、异形 | `sci-fi metroidvania, alien caverns, armored protagonist, biomechanical enemies, atmospheric isolation` |
| 恋爱模拟 | Dating Sim | 角色立绘、好感UI、日常场景 | `dating sim, anime character portraits with expressions, affection meter UI, slice-of-life scene` |
| 潜行 | Stealth Game | 阴影躲藏、敌人视野锥、标记 | `stealth game, hiding in shadows, enemy vision cone indicator, silent takedown` |
| 沉浸式模拟 | Immersive Sim | 多解法、系统交互、第一人称 | `immersive sim, first-person view, multiple interaction options, detailed environmental systems` |
| 自动化 | Automation / Factory | 传送带、组装机、效率布局 | `factory automation game, conveyor belts, assembler machines, efficient production layout, top-down view` |
| 类恶魔城 | Castlevania-like | 哥特城堡、鞭子/圣水、2D | `gothic castle interior, vampire hunter, whip weapon, 2D side-scrolling, candle drops` |

---

## 二、游戏美术风格分类

### 🎨 像素艺术系

| 风格 | 参考游戏 | Prompt 关键词 |
|------|---------|--------------|
| **8-bit 经典** | 早期 FC 游戏 | `8-bit pixel art, NES color palette, limited 4-color sprites, chunky pixels, retro 1980s game` |
| **16-bit 黄金** | SNES / MD 经典 | `16-bit pixel art, SNES color palette, detailed sprite work, rich background tiles, 1990s game` |
| **32-bit 像素** | PS1/SAT 时代 | `32-bit pixel art, pre-rendered 3D sprites, dithering, PlayStation 1 era, isometric pixel art` |
| **现代像素** | Dead Cells, Celeste | `modern pixel art, smooth animations, dynamic lighting on pixel sprites, parallax backgrounds, crisp HD pixels` |
| **极简像素** | Minit, Gato Roboto | `minimalist pixel art, 1-bit monochrome, black and white only, Game Boy style, tiny resolution` |
| **像素+光照** | Octopath Traveler | `HD-2D pixel art, 2D sprites in 3D environment, dynamic lighting and shadows on pixel characters, tilt-shift depth of field` |
| **等距像素** | 早前模拟经营 | `isometric pixel art, diamond grid, pixel-perfect building tiles, cozy pixel city` |

### 🖌️ 手绘 / 插画系

| 风格 | 参考游戏 | Prompt 关键词 |
|------|---------|--------------|
| **赛璐珞/动画风** | Genshin, Zelda BotW | `cel-shaded, toon shading, anime-style 3D, crisp outlines, flat color gradients` |
| **吉卜力风** | Ni no Kuni | `Studio Ghibli art style, hand-painted backgrounds, soft watercolor textures, whimsical fantasy` |
| **美式卡通** | Fortnite, Ratchet & Clank | `American cartoon style, exaggerated proportions, vibrant saturated colors, Pixar-like rendering` |
| **水墨画风** | 轩辕剑, 大话西游 | `Chinese ink wash painting style, sumi-e, black ink brush strokes, watercolor bleed, rice paper texture, empty space composition` |
| **水彩风** | Gris, Child of Light | `watercolor painting style, soft washes, bleeding edges, delicate color palette, wet-on-wet effect` |
| **油画风** | Dishonored 概念 | `oil painting style, visible brush strokes, impasto texture, rich oil colors, canvas grain` |
| **素描/线稿** | 未完成感风格 | `pencil sketch style, line art, cross-hatching, sketchbook paper texture, unfinished loose strokes` |
| **厚涂** | 暗黑风卡牌 | `digital thick paint, heavy impasto, bold brushwork, textured strokes, saturated darks` |
| **剪纸风** | Paper Mario | `paper cutout art style, layered papercraft, visible paper edge shadows, cardboard diorama` |
| **浮世绘** | Okami | `ukiyo-e art style, Japanese woodblock print, bold outlines, flat colors, decorative patterns` |
| **钢笔淡彩** | 独立游戏常见 | `pen and watercolor, ink line art with light color wash, sketchy loose lines, travel journal feel` |

### 💡 3D 渲染系

| 风格 | 参考游戏 | Prompt 关键词 |
|------|---------|--------------|
| **写实/拟真** | RDR2, TLOU | `photorealistic rendering, PBR materials, realistic lighting, 8K game screenshot, Unreal Engine 5` |
| **风格化写实** | Overwatch, Valorant | `stylized realism, exaggerated silhouettes, hand-painted textures, PBR with artistic touch` |
| **低多边形** | 早期3D, 独立游戏 | `low poly 3D, flat shaded, minimal polygon count, geometric, clean sharp edges` |
| **体素** | Minecraft, Teardown | `voxel art, cube-based 3D, blocky aesthetic, volumetric pixels, destructible block world` |
| **黏土/粘土** | Claymation 风格 | `claymation style, stop-motion look, plasticine texture, fingerprint marks, slight imperfections` |
| **软渲染/复古3D** | PS1 风格恐怖游戏 | `PS1 retro 3D, affine texture warping, vertex snapping, dithering, low resolution textures, no texture filtering` |
| **等距3D** | 模拟经营类 | `isometric 3D render, fixed camera angle, diorama-like, toy town aesthetic, orthographic projection` |
| **极简3D** | Monument Valley | `minimalist 3D, impossible geometry, flat colored surfaces, soft ambient lighting, clean composition` |

### 🌌 特定风格流派

| 风格 | 参考游戏 | Prompt 关键词 |
|------|---------|--------------|
| **赛博朋克** | Cyberpunk 2077 | `cyberpunk aesthetic, neon-soaked streets, holographic ads, rain-slicked asphalt, chrome and circuits, high-tech low-life` |
| **蒸汽朋克** | Bioshock Infinite | `steampunk, brass and copper machinery, clockwork gears, Victorian fashion, steam-powered technology, airships` |
| **废土** | Fallout, Mad Max | `wasteland post-apocalyptic, rusted metal, scavenged tech, desert dust, makeshift armor, nuclear fallout sky` |
| **黑暗奇幻** | Dark Souls, Diablo | `dark fantasy, gothic cathedral ruins, bone and skull motifs, dim torchlight, oppressive atmosphere, medieval horror` |
| **东方奇幻** | 仙剑, 黑神话 | `Chinese mythology fantasy, jade palaces on clouds, silk robes flowing, dragon serpent in mist, ancient sacred mountains` |
| **童话/绘本** | Ori, Trine | `fairytale illustration style, enchanted forest, glowing magical creatures, storybook pages, soft ethereal light rays` |
| **梦核/怪核** | 实验独立游戏 | `dreamcore aesthetic, liminal space, uncanny familiar places, soft nostalgic haze, slightly unsettling emptiness` |
| **波普艺术** | Hi-Fi Rush | `pop art comic style, Ben-Day dots, halftone patterns, bold primary colors, comic book panel borders, onomatopoeia` |
| **新艺术运动** | Transistor | `Art Nouveau style, flowing organic curves, decorative botanical motifs, stained glass colors, Alphonse Mucha inspired` |
| **生物机械** | Scorn | `biomechanical aesthetic, H.R. Giger inspired, flesh fused with machine, organic tubes and metal, eerie bio-horror` |
| **极简几何** | 140, Thomas Was Alone | `minimalist geometric, basic shapes only, flat color fields, negative space, abstract representation` |
| **合成器浪潮** | Far Cry Blood Dragon | `synthwave aesthetic, outrun style, neon grid, sunset gradient sky, 80s retro-future, chrome title font` |
| **剪纸中国风** | 纸人, 纸境 | `Chinese paper-cutting art, intricate cut-out patterns, red and gold, layered shadow depth, traditional folk art` |

---

## 三、氛围与光色关键词库

### 🌤️ 时间 / 天气

```
日出 golden hour: "golden hour, warm sunrise light, long soft shadows, amber sky gradient"
正午强光: "harsh midday sun, high contrast, deep black shadows, bright highlights"
黄昏: "dusk, purple-orange sky, silhouettes, ambient warm glow, last light"
夜晚: "moonlit night, cool blue ambient, starry sky, soft rim light, bioluminescent accents"
阴天: "overcast sky, diffused soft light, muted colors, atmospheric fog, no harsh shadows"
雨天: "rain-soaked scene, wet reflections on ground, moody grey sky, water droplets, puddles"
暴风雨: "dramatic storm clouds, lightning flash, wind-blown debris, dark ominous sky, heavy rain"
雪景: "snow-covered landscape, soft pristine white, cold blue undertones, gentle snowfall, winter wonderland"
雾: "dense fog, volumetric mist, limited visibility, silhouettes emerging, mysterious atmosphere"
```

### 🎭 情绪 / 氛围

```
史诗: "epic scale, dramatic composition, heroic pose, god rays from sky, awe-inspiring, cinematic wide shot"
温馨: "cozy atmosphere, warm fireplace light, soft ambient, comfortable lived-in space, gentle colors"
压抑: "oppressive atmosphere, claustrophobic framing, desaturated colors, looming threat, psychological tension"
空灵: "ethereal atmosphere, floating particles, soft glow, dreamlike quality, translucent elements, heavenly light"
神秘: "mysterious ambiance, shadow play, hidden details, ancient secrets, magical glow, sense of discovery"
恐怖: "unsettling atmosphere, flickering lights, deep shadows, disturbing details, psychological horror, dread"
欢乐: "cheerful vibrant, bright saturated colors, bouncy energy, playful elements, celebration atmosphere"
孤寂: "lonely and desolate, vast empty space, single figure, melancholic mood, quiet stillness, abandoned"
```

### 💡 光照方案

```
体积光: "volumetric lighting, god rays, light shafts through windows/forest canopy, atmospheric scattering"
逆光: "backlit silhouette, rim lighting, halo effect, dramatic contrast, figure outlined by light"
霓虹: "neon lighting, colored rim lights, cyberpunk glow, reflected neon on surfaces, dark ambient with bright accents"
烛光: "candlelit scene, warm flickering orange, intimate small light source, dancing shadows, medieval ambiance"
圣光: "divine light, rays from above, pure white-gold glow, heavenly illumination, religious iconography lighting"
双色光: "dual color lighting, teal and orange, warm key light + cool fill, cinematic color contrast"
生物光: "bioluminescent glow, magical blue-green light, glowing flora, fantasy cave illumination, Avatar-like"
```

### 🎨 配色方案

```
暖色调: "warm color palette, reds oranges golds, sunset tones, inviting heat"
冷色调: "cool color palette, blues teals purples, cold atmosphere, icy feel"
高饱和: "highly saturated colors, vibrant vivid, pop art intensity, pure hues"
低饱和/褪色: "desaturated muted colors, washed out, faded photograph, vintage palette, pastel tones"
单色调: "monochromatic palette, single hue variations, sepia tone, blue mood"
互补色: "complementary colors, teal and orange, purple and yellow, blue and gold, strong visual pop"
大地色: "earthy palette, ochre terracotta olive, grounded natural colors, autumn feel"
```

---

## 四、技术质量关键词

### 📐 构图 / 镜头

| 关键词 | 效果 |
|--------|------|
| `cinematic wide shot` | 电影宽幅画面 |
| `dutch angle` | 倾斜构图，不安感 |
| `bird's eye view` | 俯视鸟瞰 |
| `worm's eye view` | 仰视 |
| `close-up portrait` | 角色特写 |
| `over-the-shoulder` | 越肩视角 |
| `dynamic action shot` | 动态动作镜头 |
| `symmetrical composition` | 对称构图 |
| `rule of thirds` | 三分法构图 |
| `foreground framing` | 前景框景 |
| `depth of field bokeh` | 景深虚化 |

### 🔧 画质增强

| 关键词 | 效果 |
|--------|------|
| `8K resolution` | 超高分辨率 |
| `Unreal Engine 5 render` | 虚幻5质感 |
| `ray tracing global illumination` | 光追全局光照 |
| `PBR materials` | 物理材质 |
| `ambient occlusion` | 环境光遮蔽 |
| `subsurface scattering` | 次表面散射（皮肤透光） |
| `sharp focus` | 锐利焦点 |
| `highly detailed` | 高细节 |
| `intricate details` | 精细纹理 |
| `4K game wallpaper` | 游戏壁纸级画质 |

### 🖼️ 后期/渲染

| 关键词 | 效果 |
|--------|------|
| `concept art` | 概念美术风格 |
| `splash art` | 游戏原画/载入图风格 |
| `key visual` | 主视觉图 |
| `game screenshot` | 游戏内截图感 |
| `in-engine render` | 引擎内渲染 |
| `pre-rendered background` | 预渲染背景 |
| `matte painting` | 数字绘景 |
| `vignette` | 暗角效果 |
| `film grain` | 胶片颗粒 |
| `chromatic aberration` | 色差效果 |
| `bloom effect` | 泛光效果 |
| `lens flare` | 镜头光晕 |

---

## 五、Prompt 组合模板

### 📋 模板 A：游戏截图风（Screenshot Style）

```
[游戏类别], game screenshot, in-game footage, [美术风格], [视角], [光照], [情绪], HUD elements visible, [画质词], --ar 16:9
```

**示例：**
> `soulslike action RPG, game screenshot, dark fantasy gothic architecture, over-the-shoulder view, volumetric fog lighting, oppressive atmosphere, boss health bar HUD, Unreal Engine 5 quality, 8K, --ar 16:9`

### 📋 模板 B：概念美术风（Concept Art Style）

```
[风格] concept art of [游戏类型] [场景内容], [美术风格], [光照方案], [配色], [构图], painterly brush strokes, artstation trending, --ar 16:9
```

**示例：**
> `concept art of cyberpunk action game city street, synthwave aesthetic, neon dual lighting, teal and magenta palette, cinematic wide shot, artstation trending, highly detailed, --ar 16:9`

### 📋 模板 C：像素游戏风（Pixel Art Style）

```
[像素精度] pixel art, [游戏类型], [场景元素], [调色板参考], [技术词], crisp pixels, no antialiasing, [画幅]
```

**示例：**
> `16-bit pixel art, top-down RPG, village scene with shops and NPCs, SNES color palette rich warm tones, parallax scrolling background layers, crisp pixels, no antialiasing`

### 📋 模板 D：角色立绘/卡牌风（Character Art Style）

```
[风格] character art, [角色描述], [姿势], [服装/装备], [背景风格], [光照], splash art quality, [画质词], --ar 2:3
```

**示例：**
> `anime cel-shaded character art, female swordmaster with flowing silver hair, dynamic battle stance, ornate Chinese fantasy armor, ink wash landscape background, rim lighting, splash art quality, intricate details, --ar 2:3`

### 📋 模板 E：场景氛围图（Environment Art Style）

```
[风格] environment art, [场景描述], [时间/天气], [光照], [情绪], [构图], atmospheric, matte painting quality, --ar 16:9
```

**示例：**
> `Studio Ghibli style environment art, floating sky islands with ancient ruins, golden hour sunset, volumetric light rays through clouds, ethereal peaceful mood, wide establishing shot, atmospheric, matte painting quality, --ar 16:9`

---

## 六、快速检索索引

### 按你想生成的"感觉"查找

| 想要的感觉 | 推荐游戏类别 | 推荐美术风格 | 关键氛围词 |
|-----------|-------------|-------------|-----------|
| 热血战斗 | 动作/格斗/ARPG | 赛璐珞 / 写实 | dynamic action, high contrast |
| 唯美治愈 | 冒险/种田模拟 | 吉卜力 / 水彩 / 童话 | cozy, soft light, pastel |
| 黑暗深沉 | 类魂/恐怖 | 黑暗奇幻 / 油画 / 写实 | oppressive, volumetric fog |
| 科幻未来 | 射击/赛博朋克 | 赛博朋克 / 合成器浪潮 | neon, rain-slicked, hologram |
| 东方古典 | 武侠/修仙 RPG | 水墨 / 剪纸中国风 | misty, jade, silk, ancient |
| 怀旧复古 | 平台跳跃/像素 | 8/16-bit 像素 / PS1 3D | retro, chunky, CRT scanline |
| 荒诞怪奇 | 独立/实验 | 梦核 / 生物机械 / 极简 | unsettling, liminal, uncanny |
| 夸张欢乐 | 卡丁车/派对 | 美式卡通 / 波普 | vibrant, bouncy, exaggerated |

---

## 七、常用 Negative Prompt（SD/ComfyUI 用）

```text
photorealistic face distortion, bad anatomy, extra limbs, blurry, low resolution, 
jpeg artifacts, watermark, text, signature, ui elements, modern clothing 
(on traditional settings), plastic skin, oversaturated, cartoonish proportions 
(when aiming for realistic), wrong perspective, deformed hands
```

---

## 八、实战速查卡片

### 🃏 30 秒选风格

```
想做 _______ 类型的游戏画面

1. 选类别 prompt：从第一章找
2. 选风格 prompt：从第二章找
3. 选氛围色：从第三章找
4. 加画质词：从第四章找

→ 套模板组合
→ 生成 4-8 张挑选
→ 保留满意 prompt 写入个人词库
```

---

> 📌 **维护建议**：每当你用某个 prompt 生成出满意的图，把完整 prompt 追加到这个文件末尾的「个人收藏」区域，附上生成日期和模型，积累你自己的精选词库。

---

*最后更新：2026-06-25*
*适用模型：Midjourney v6 / SDXL / SD3 / Flux / DALL·E 3 / GPT Image 2*
