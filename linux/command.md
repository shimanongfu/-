### 文件管理 ##############################

1. ls
列出目录中的文件和子目录。
常用选项：
bash
复制代码
ls                # 列出当前目录的文件
ls -l             # 以长格式列出文件和目录
ls -a             # 列出所有文件，包括隐藏文件
ls -lh            # 以人类可读的格式显示文件大小
2. cd
改变当前工作目录。
示例：
bash
复制代码
cd /path/to/directory    # 进入指定目录
cd ..                     # 返回上一级目录
cd ~                      # 进入用户的主目录
3. pwd
显示当前工作目录的完整路径。
示例：
bash
复制代码
pwd
4. mkdir
创建新目录。
示例：
bash
复制代码
mkdir new_directory      # 创建一个新目录
mkdir -p /path/to/directory/new_directory  # 创建多层目录
5. rmdir
删除空目录。
示例：
bash
复制代码
rmdir empty_directory     # 删除空目录
6. rm
删除文件或目录。
常用选项：
bash
复制代码
rm file.txt              # 删除文件
rm -r directory_name      # 递归删除目录及其内容
rm -f file.txt           # 强制删除文件，无需确认
7. cp
复制文件或目录。
常用选项：
bash
复制代码
cp source.txt destination.txt          # 复制文件
cp -r source_directory destination_directory  # 递归复制目录
8. mv
移动文件或目录，或重命名文件。
示例：
bash
复制代码
mv old_name.txt new_name.txt          # 重命名文件
mv file.txt /path/to/directory/       # 移动文件到指定目录
9. touch
创建空文件或更新现有文件的时间戳。
示例：
bash
复制代码
touch newfile.txt           # 创建新文件
10. cat
查看文件内容、合并文件。
示例：
bash
复制代码
cat file.txt               # 显示文件内容
cat file1.txt file2.txt > merged.txt  # 合并文件
11. more / less
分页显示文件内容，适合查看大文件。
示例：
bash
复制代码
more file.txt              # 分页显示文件
less file.txt              # 使用 less 分页显示文件
12. head / tail
查看文件的开头或结尾部分。
示例：
bash
复制代码
head -n 10 file.txt        # 显示文件的前 10 行
tail -n 10 file.txt        # 显示文件的后 10 行
tail -f log.txt            # 实时查看文件追加内容
13. find
在目录中查找文件。
示例：
bash
复制代码
find /path/to/search -name "file.txt"       # 查找指定文件
find . -type f -size +10M                    # 查找大于 10MB 的文件
14. locate
快速查找文件，基于预先建立的索引。
示例：
bash
复制代码
locate file.txt         # 查找文件
15. du
显示目录或文件的磁盘使用情况。
示例：
bash
复制代码
du -h /path/to/directory          # 显示目录大小
du -sh /path/to/directory         # 显示总大小
16. df
显示文件系统的磁盘空间使用情况。
示例：
bash
复制代码
df -h              # 以人类可读的格式显示磁盘使用情况
17. chmod
更改文件或目录的权限。
示例：
bash
复制代码
chmod 755 file.txt          # 设置文件权限为 rwxr-xr-x
chmod -R 755 directory      # 递归更改目录权限
18. chown
更改文件或目录的所有者和所属组。
示例：
bash
复制代码
chown user:group file.txt       # 更改文件所有者和组
19. tar
打包和压缩文件或目录。
常用选项：
bash
复制代码
tar -cvf archive.tar directory       # 创建 tar 包
tar -xvf archive.tar                  # 解压 tar 包
20. zip / unzip
压缩和解压缩文件。
示例：
bash
复制代码
zip archive.zip file1.txt file2.txt  # 压缩文件
unzip archive.zip                      # 解压缩文件
总结
查看和导航：ls，cd，pwd
创建和删除：mkdir，rmdir，rm
复制和移动：cp，mv
文件查看：cat，more，less，head，tail
查找文件：find，locate
磁盘使用：du，df
权限管理：chmod，chown
打包和压缩：tar，zip，unzip

#####


### 进程管理 ##############################

1. ps
显示当前运行的进程信息。
常用选项：
ps aux        # 显示所有用户的所有进程
ps -ef        # 以全格式显示进程

2. top
动态显示系统中正在运行的进程和资源使用情况。
启动后，按 q 退出。
可以按 M 按内存使用量排序，按 P 按 CPU 使用量排序。

3. htop
类似于 top，但具有更友好的界面和更多功能（需要安装）。
使用箭头键选择进程，可以使用 F9 结束进程。

4. kill
终止指定的进程。
语法：
kill <pid>              # 发送 SIGTERM 信号，优雅地终止进程
kill -9 <pid>           # 发送 SIGKILL 信号，强制终止进程

5. pkill
根据进程名称终止进程。
示例：
pkill process_name      # 终止所有名为 process_name 的进程

6. killall
终止指定名称的所有进程。
示例：
killall 

7. bg 和 fg
管理后台和前台进程。
bg 将进程放到后台运行，fg 将后台进程调回前台。
示例：
bg %1                # 将作业编号为 1 的进程放到后台
fg %1                # 将作业编号为 1 的进程调回前台

8. jobs
显示当前用户的作业列表，包括后台和挂起的作业。
示例：
jobs

9. nice 和 renice
nice 用于以指定的优先级启动新进程。
示例：
nice -n 10 command_name    # 以优先级 10 启动进程

renice 用于修改已运行进程的优先级。
renice -n 10 -p <pid>      # 将指定 PID 的进程优先级改为 10

10. pstree
以树状结构显示进程及其父子关系。
示例：
pstree          # 显示所有进程树
pstree -p      # 显示进程树及 PID

11. systemctl
管理系统服务和进程（适用于使用 systemd 的系统）。
示例：
systemctl start service_name    # 启动服务
systemctl stop service_name     # 停止服务
systemctl restart service_name   # 重启服务
systemctl status service_name     # 查看服务状态

12. strace
跟踪进程的系统调用和信号，适合调试。
示例：
strace -p <pid>       # 跟踪指定 PID 的进程

13. lsof
列出打开的文件和进程。
复制代码
lsof -p <pid>          # 查看指定进程打开的文件
lsof | grep filename   # 查找哪个进程打开了指定文件

14. free
显示系统内存使用情况。
示例：
free -h                # 以人类可读的格式显示内存使用情况

总结
查看进程：ps，top，htop，pstree
终止进程：kill，pkill，killall
管理后台/前台进程：bg，fg，jobs
调整进程优先级：nice，renice
管理系统服务：systemctl
跟踪进程调用：strace
列出打开文件：lsof
查看内存使用：free

#####


### 网络管理 ##############################

Linux 提供了大量用于管理和诊断网络的命令。这些工具有助于管理网络接口、配置 IP 地址、检查网络状态、排查网络故障等。以下是一些常用的 Linux 网络管理命令：

1. ifconfig / ip
ifconfig：用于配置网络接口（已被 ip 命令取代，但在某些系统上仍可用）。
ifconfig
ifconfig eth0 down  # 禁用网络接口
ifconfig eth0 up    # 启用网络接口
ip：替代 ifconfig，功能更强大，用于显示和修改网络接口、路由和其他网络配置。

ip addr show                # 显示所有网络接口及 IP 地址
ip link set eth0 up         # 启用网络接口 eth0
ip addr add 192.168.1.10/24 dev eth0  # 为接口添加 IP 地址
ip route show               # 显示路由表
ip route add default via 192.168.1.1  # 添加默认网关

2. ping
用于测试目标主机的连通性，发送 ICMP 回显请求。
ping google.com
ping -c 4 192.168.1.1  # 发送 4 个数据包

3. traceroute
显示数据包到达目的主机时经过的所有中间路由器。
traceroute google.com

4. netstat / ss
netstat：显示网络连接、路由表、接口统计信息等（已被 ss 替代，但部分系统仍使用）。
netstat -tuln  # 显示所有监听的 TCP 和 UDP 端口
netstat -r     # 显示路由表
netstat -i     # 显示网络接口统计

ss：用于显示套接字信息，类似 netstat，但速度更快。
ss -tuln   # 查看正在监听的 TCP/UDP 端口
ss -s      # 显示套接字摘要信息

5. nmcli
NetworkManager 的命令行工具，用于管理网络连接（适用于使用 NetworkManager 的系统）。
nmcli device status    # 查看网络设备状态
nmcli connection show  # 显示所有连接
nmcli device connect eth0  # 连接设备
nmcli device disconnect eth0  # 断开设备连接

6. route
显示和修改路由表（已被 ip route 取代）。
route -n        # 显示路由表
route add default gw 192.168.1.1  # 设置默认网关

7. dig / nslookup
dig：用于查询 DNS 信息（推荐使用 dig 代替 nslookup）。
dig example.com
dig +short example.com  # 简化输出

nslookup：用于查询 DNS 信息。
nslookup example.com

8. curl / wget
curl：用于发送 HTTP/HTTPS 请求，测试 URL 连接。
curl http://example.com
curl -I http://example.com  # 只获取响应头

wget：用于下载文件。
wget http://example.com/file.zip

9. tcpdump
抓取和分析网络流量，适合网络问题的深入诊断。
tcpdump -i eth0     # 在 eth0 接口上抓包
tcpdump -n host 192.168.1.10  # 只捕获与指定 IP 地址的通信

10. nmap
强大的端口扫描工具，用于扫描主机和网络服务。
nmap -p 80 example.com  # 扫描指定端口
nmap -sS 192.168.1.0/24  # 扫描局域网中的所有主机

11. nc (Netcat)
网络工具，能进行端口扫描、发送/接收数据，支持 TCP 和 UDP。
nc -zv example.com 80    # 测试指定主机的端口是否打开
nc -l 1234               # 监听 1234 端口

12. iperf
用于测量网络带宽的工具，支持 TCP 和 UDP。
iperf -s      # 作为服务器监听
iperf -c 192.168.1.10 -p 5001  # 连接到服务器测试带宽

13. ethtool
查看和调整网络接口的硬件设置。
ethtool eth0  # 查看网络接口 eth0 的设置
ethtool -s eth0 speed 100 duplex full  # 设置网卡速度为 100Mb 全双工

14. hostname
查看或设置主机名。
hostname             # 查看主机名
hostnamectl set-hostname new-hostname  # 设置主机名

15. systemctl（适用于使用 systemd 的系统）
启动/停止网络服务。
systemctl restart NetworkManager   # 重启 NetworkManager
systemctl restart networking       # 重启网络服务

16. firewalld / ufw
管理防火墙规则。
firewalld（适用于支持 firewalld 的系统）：
firewall-cmd --list-all    # 显示所有防火墙规则
firewall-cmd --add-port=80/tcp --permanent  # 添加防火墙规则
firewall-cmd --reload      # 重新加载防火墙配置

ufw（适用于 Ubuntu 和一些基于 Debian 的系统）：
ufw enable          # 启用防火墙
ufw allow 80/tcp    # 允许 HTTP 流量
ufw status          # 查看防火墙状态

17. arp
显示和修改系统的 ARP 缓存。
arp -n    # 显示 ARP 表
arp -d 192.168.1.10  # 删除某个 IP 地址的 ARP 缓存

18. mtr
综合了 ping 和 traceroute，用于诊断网络问题。
mtr google.com


总结
基础网络管理：ip，ifconfig，route
网络诊断：ping，traceroute，netstat，ss，mtr
DNS 工具：dig，nslookup
网络流量分析：tcpdump，nmap，nc
下载和测试：curl，wget
带宽测试：iperf
防火墙管理：firewalld，ufw
这些命令可以帮助你高效地管理和排查 Linux 系统的网络问题。

#####


### 磁盘管理 ##############################

1. df
显示文件系统的磁盘空间使用情况。
示例：
bash
复制代码
df -h               # 以人类可读的格式显示磁盘使用情况
2. du
显示目录或文件的磁盘使用情况。
示例：
bash
复制代码
du -h /path/to/directory       # 显示指定目录的大小
du -sh /path/to/directory      # 显示总大小
3. fdisk
磁盘分区工具，用于创建和管理磁盘分区（通常用于 MBR 格式的磁盘）。
示例：
bash
复制代码
sudo fdisk -l                   # 列出所有磁盘及其分区
sudo fdisk /dev/sda             # 进入特定磁盘的分区管理界面
4. parted
分区管理工具，支持 MBR 和 GPT 格式的磁盘。
示例：
bash
复制代码
sudo parted /dev/sda             # 进入特定磁盘的 parted 管理界面
5. lsblk
列出所有块设备及其挂载点。
示例：
bash
复制代码
lsblk               # 显示所有块设备
6. blkid
显示块设备的信息，包括 UUID 和文件系统类型。
示例：
bash
复制代码
blkid               # 列出所有块设备及其信息
7. mount
挂载文件系统。
示例：
bash
复制代码
sudo mount /dev/sda1 /mnt     # 将 /dev/sda1 挂载到 /mnt
8. umount
卸载文件系统。
示例：
bash
复制代码
sudo umount /mnt               # 卸载 /mnt
9. fsck
文件系统检查和修复工具。
示例：
bash
复制代码
sudo fsck /dev/sda1            # 检查文件系统
10. mkfs
创建文件系统。
常用选项：
bash
复制代码
sudo mkfs.ext4 /dev/sda1       # 在 /dev/sda1 上创建 ext4 文件系统
sudo mkfs.xfs /dev/sda2        # 在 /dev/sda2 上创建 XFS 文件系统
11. resize2fs
调整 ext2/ext3/ext4 文件系统的大小。
示例：
bash
复制代码
sudo resize2fs /dev/sda1       # 调整文件系统大小
12. dd
用于备份和恢复磁盘或分区。
示例：
bash
复制代码
sudo dd if=/dev/sda of=/dev/sdb bs=64K conv=noerror,sync  # 备份整个磁盘
13. df -i
显示 inode 使用情况。
示例：
bash
复制代码
df -i              # 显示各文件系统的 inode 使用情况
14. tune2fs
调整 ext2/ext3/ext4 文件系统的参数。
示例：
bash
复制代码
sudo tune2fs -m 1 /dev/sda1    # 设置保留空间为 1%
15. hdparm
查看和设置 SATA 硬盘参数。
示例：
bash
复制代码
sudo hdparm -I /dev/sda         # 查看硬盘信息
16. smartctl
查看硬盘的健康状态（需要安装 smartmontools）。
示例：
bash
复制代码
sudo smartctl -a /dev/sda       # 显示硬盘健康信息
总结
查看磁盘使用情况：df，du
分区管理：fdisk，parted
列出块设备：lsblk，blkid
挂载与卸载：mount，umount
文件系统检查与修复：fsck
创建文件系统：mkfs
调整文件系统大小：resize2fs
备份与恢复：dd
查看和设置硬盘参数：hdparm
检查硬盘健康状态：smartctl

#####


### 系统管理 ##############################

1. 用户和组管理
查看用户：
bash
复制代码
cat /etc/passwd               # 显示所有用户
添加用户：
bash
复制代码
sudo adduser username         # 添加新用户
删除用户：
bash
复制代码
sudo deluser username         # 删除用户
修改用户信息：
bash
复制代码
sudo usermod -aG groupname username  # 将用户添加到组
2. 组管理
查看组：
bash
复制代码
cat /etc/group                # 显示所有组
添加组：
bash
复制代码
sudo addgroup groupname       # 添加新组
删除组：
bash
复制代码
sudo delgroup groupname       # 删除组
3. 服务管理
查看服务状态：
bash
复制代码
systemctl status service_name  # 查看服务状态
启动服务：
bash
复制代码
sudo systemctl start service_name  # 启动服务
停止服务：
bash
复制代码
sudo systemctl stop service_name   # 停止服务
重启服务：
bash
复制代码
sudo systemctl restart service_name # 重启服务
启用开机启动：
bash
复制代码
sudo systemctl enable service_name  # 设置服务开机启动
禁用开机启动：
bash
复制代码
sudo systemctl disable service_name # 禁用服务开机启动
4. 网络管理
查看网络接口：
bash
复制代码
ip addr show                    # 显示网络接口及其状态
测试网络连接：
bash
复制代码
ping example.com                # 测试与主机的连通性
查看路由表：
bash
复制代码
ip route show                   # 显示路由表
5. 文件和目录管理
查看磁盘使用情况：
bash
复制代码
df -h                           # 显示文件系统的磁盘空间使用情况
查看内存使用情况：
bash
复制代码
free -h                         # 显示内存使用情况
6. 进程管理
查看当前进程：
bash
复制代码
ps aux                          # 显示所有进程
终止进程：
bash
复制代码
kill <pid>                      # 终止指定的进程
7. 系统信息
查看系统信息：
bash
复制代码
uname -a                        # 显示系统信息
查看CPU信息：
bash
复制代码
lscpu                           # 显示 CPU 详细信息
查看内存信息：
bash
复制代码
cat /proc/meminfo               # 显示内存信息
8. 日志管理
查看系统日志：
bash
复制代码
journalctl -xe                  # 查看最近的日志
实时查看日志：
bash
复制代码
journalctl -f                   # 实时查看日志
9. 软件包管理（基于 Debian 系统）
更新软件包列表：
bash
复制代码
sudo apt update                 # 更新软件包列表
安装软件包：
bash
复制代码
sudo apt install package_name    # 安装软件包
删除软件包：
bash
复制代码
sudo apt remove package_name     # 删除软件包
10. 安全管理
查看当前登录用户：
bash
复制代码
who                             # 显示当前登录的用户
查看用户的活动：
bash
复制代码
last                            # 查看用户登录历史
总结
用户和组管理：adduser，deluser，usermod
服务管理：systemctl
网络管理：ip，ping
文件和目录管理：df，free
进程管理：ps，kill
系统信息：uname，lscpu
日志管理：journalctl
软件包管理：apt
安全管理：who，last

#####