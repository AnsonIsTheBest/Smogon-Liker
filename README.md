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
双击用记事本打开.env文件，里面是我们需要配置的东西。
<img width="1124" height="268" alt="image" src="https://github.com/user-attachments/assets/1cc7878c-b25d-4fea-ad54-c720ecfcf841" />
懒得写了晚点补上，自己查吧不会问我，晚点写个自动获取的插件
