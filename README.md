使用教程：
目录
1. 安装node.js
2. 下载smogon-liker
3. 安装前置
4. 原神启动

   
首先安装node.js
https://nodejs.org/zh-cn/download
<img width="970" height="910" alt="image" src="https://github.com/user-attachments/assets/b8527993-0ed5-4c4e-a5db-bb43a8d04f0b" />
(在圆圈处选择你的系统并下载）（建议使用安装程序）

以windows为例，双击.msi文件安装

安装后打开cmd或者powershell

*（win+r 输入"cmd"三个字母/"powershell"十个字母然后回车，这样比较帅。）*
<img width="496" height="255" alt="powershell" src="https://github.com/user-attachments/assets/1dc40f87-0abb-4f29-bb01-40b8fbeac439" />
<img width="499" height="252" alt="cmd" src="https://github.com/user-attachments/assets/bd0f2823-9e74-4c10-bd42-5bbfe16acbba" />

*（不帅的可以在侧边栏windows菜单直接搜索终端，选择命令提示符或者windows powershell。）*
<img width="972" height="946" alt="image" src="https://github.com/user-attachments/assets/6ee78267-915d-4007-a627-72ee26895947" />

*（win11可以在windows资源管理器里右键空白地方选择在此处打开终端）*
<img width="282" height="363" alt="image" src="https://github.com/user-attachments/assets/ec4884b8-21ec-45da-9a38-aaf3b9446a83" />
<img width="319" height="372" alt="image" src="https://github.com/user-attachments/assets/72e77856-9293-470b-9b90-249dc81c7992" />

(建议使用powershell，有tab自动补全，ui也好看，稍微人性化一点）


打开后分别输入下面两行
node -v
npm -v
分别输出一个版本号（比如v20.19.3)说明安装成功了
输出一串洋文说明没成功

至此，我们第一步就完成了。

第二步需要你下载这个smogon-liker
https://github.com/AnsonIsTheBest/Smogon-Liker/releases
点图片里圈出来的
<img width="1918" height="948" alt="image" src="https://github.com/user-attachments/assets/7cd31568-62e5-4278-b9ca-25364bb52088" />

然后找个**单独的文件夹**解压出来

应该长这样
<img width="918" height="611" src="https://github.com/user-attachments/assets/bac90a08-a373-4972-98ae-7313d77a0c2a" />
长这样就是成功了


第三步需要安装前置
在我们第一步的时候打开过终端对吧？现在我们需要再次打开终端了。不是通过文件夹内右键打开的需要先输入"cd [你解压的路径，也就是index.js所在的那个目录。不知道在哪的可以找到index.js右键一下，点击属性，复制属性里的位置，然后黏贴到终端内（终端窗口内不选择内容直接右键鼠标就是黏贴）]
比如我的就是cd C:\Users\vian9\Downloads\smogon-liker-release\Smogon-Liker-1.0.0
文件夹内右键打开的在文件资源管理器里找到index.js在它旁边空白的地方右键打开就自动配置好了。
<img width="892" height="33" alt="image" src="https://github.com/user-attachments/assets/48566e92-2403-4d10-9be7-37ab6bc419dc" />
<img width="1465" height="489" alt="image" src="https://github.com/user-attachments/assets/6bd7d04d-967a-4f35-85bb-92a33b4c9809" />
长这样就是好了

然后输入npm install
等待一会，等他不动了就是配置好了

第四步我们需要启动原神
首先前往https://ys.mihoyo.com/?utm_source=yuanshen_web，点击pc下载，下载完了安装原神，然后玩到六十级再往下看
玩完了原神我们来启动我们的点赞程序。在启动之前我们需要先进行配置。
双击用记事本打开.env文件，里面是大部分我们需要配置的东西。
<img width="1124" height="268" alt="image" src="https://github.com/user-attachments/assets/1cc7878c-b25d-4fea-ad54-c720ecfcf841" />

第一行的token，需要自行填写 是用于模拟discord登录，利用我下面提供的插件可以方便的获取。教程在下面
第二三行不用了
第四行是频道id。需要自行填写。 首先访问网页版discord(https://discord.com/channels/@me),然后点左下角小齿轮，找到language，先把语言换成中文。然后找到高级设置，开启开发者模式。退出设置界面，然后鼠标右键你的like like channel，点击复制频道id。这个就是你的频道id
<img width="1917" height="923" alt="image" src="https://github.com/user-attachments/assets/9b50510f-5cea-451a-8e83-b5e7d912e363" />
<img width="1914" height="917" alt="image" src="https://github.com/user-attachments/assets/5ab1d09c-f3e9-4c95-be9d-3ee31c75f679" />
<img width="1919" height="900" alt="屏幕截图 2025-09-18 192807" src="https://github.com/user-attachments/assets/dd582f0f-c395-4266-8a34-c297607b4ef1" />

第五行不用管
第六行是冷却，太快了会不让进去，速度要适中才会舒服
第七行写在里面了，应该是不用改
第八行也写在里面了，应该也是不用改
第九行是抓取的discord的历史消息的数量，意思就是启动机器人之后会查找多少条以内的消息来找like like的链接

安装这个
https://greasyfork.org/en/scripts/550007-export-discord-token-and-smogon-cookies
油猴怎么装都会了吧，不会找我
然后打开https://discord.com/channels/@me 右上角会有一串



{
  "token": "dhsioj jsoij js jiojsijo jsijo "
}


复制dhsioj jsoij js jiojsijo jsijo 这一串，这就是你的token。

然后还有一个smogon cookie要导出，这个用于模拟登录smogon
还是上面那个脚本，打开forum.smogon.com 然后右上角还是会出来一个框，点击那个蓝色的按钮。然后把下载下来的文件拖到你的index.js同一文件夹下选择替换

最后像之前一样在文件夹下启动终端，输入node index.js就能启动了
报错我都改成中文了，报出英文的错就来找我
