<template>
  <view class="profile-container">
    <!-- 公共头部：头像/昵称/角色标签 -->
    <view class="profile-header">
      <image :src="userInfo.avatar" class="avatar" mode="circle"></image>
      <view class="user-info">
        <text class="nickname">{{ userInfo.nickname }}</text>
        <text class="role-label" :class="roleLabelClass">{{ currentRoleText }}</text>
      </view>
    </view>

    <!-- 角色专属信息区 -->
    <!-- 学生角色 -->
    <view v-if="currentRole === 'student'" class="role-card student-card">
      <view class="card-title">学生信息</view>
      <view class="info-item">
        <text class="info-label">学号：</text>
        <text class="info-value">{{ userInfo.studentId }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">年级/专业：</text>
        <text class="info-value">{{ userInfo.grade }} / {{ userInfo.major }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">累计咨询次数：</text>
        <text class="info-value">{{ userInfo.consultCount }} 次</text>
      </view>
      <view class="info-item">
        <text class="info-label">最近咨询时间：</text>
        <text class="info-value">{{ userInfo.lastConsultTime || "暂无" }}</text>
      </view>

      <!-- 学生专属功能入口 -->
      <view class="function-list">
        <view class="func-item" @click="toMyAppointment">
          <image src="/static/icons/appointment.png" class="func-icon"></image>
          <text class="func-text">我的预约</text>
          <image src="/static/icons/arrow-right.png" class="arrow-icon"></image>
        </view>
        <view class="func-item" @click="toMyTest">
          <image src="/static/icons/test.png" class="func-icon"></image>
          <text class="func-text">我的测试报告</text>
          <image src="/static/icons/arrow-right.png" class="arrow-icon"></image>
        </view>
        <view class="func-item" @click="toEditStudentInfo">
          <image src="/static/icons/edit.png" class="func-icon"></image>
          <text class="func-text">编辑个人信息</text>
          <image src="/static/icons/arrow-right.png" class="arrow-icon"></image>
        </view>
      </view>
    </view>

    <!-- 咨询师角色 -->
    <view v-else-if="currentRole === 'consultant'" class="role-card consultant-card">
      <view class="card-title">咨询师信息</view>
      <view class="info-item">
        <text class="info-label">工号：</text>
        <text class="info-value">{{ userInfo.consultantId }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">专业领域：</text>
        <text class="info-value">{{ userInfo.specialty }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">累计服务人数：</text>
        <text class="info-value">{{ userInfo.serviceCount }} 人</text>
      </view>
      <view class="info-item">
        <text class="info-label">待处理预约：</text>
        <text class="info-value red-text">{{ userInfo.pendingAppointment }} 条</text>
      </view>

      <!-- 咨询师专属功能入口 -->
      <view class="function-list">
        <view class="func-item" @click="toMySchedule">
          <image src="/static/icons/schedule.png" class="func-icon"></image>
          <text class="func-text">我的排班</text>
          <image src="/static/icons/arrow-right.png" class="arrow-icon"></image>
        </view>
        <view class="func-item" @click="toMyStudents">
          <image src="/static/icons/student.png" class="func-icon"></image>
          <text class="func-text">我的服务学生</text>
          <image src="/static/icons/arrow-right.png" class="arrow-icon"></image>
        </view>
        <view class="func-item" @click="toConsultRecord">
          <image src="/static/icons/record.png" class="func-icon"></image>
          <text class="func-text">咨询记录管理</text>
          <image src="/static/icons/arrow-right.png" class="arrow-icon"></image>
        </view>
      </view>
    </view>

    <!-- 管理员角色 -->
    <view v-else-if="currentRole === 'admin'" class="role-card admin-card">
      <view class="card-title">管理员信息</view>
      <view class="info-item">
        <text class="info-label">管理账号：</text>
        <text class="info-value">{{ userInfo.adminAccount }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">所属权限组：</text>
        <text class="info-value">{{ userInfo.permissionGroup }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">系统总用户数：</text>
        <text class="info-value">{{ userInfo.totalUserCount }} 人</text>
      </view>
      <view class="info-item">
        <text class="info-label">待审核咨询师：</text>
        <text class="info-value red-text">{{ userInfo.pendingAuditCount }} 人</text>
      </view>

      <!-- 管理员专属功能入口 -->
      <view class="function-list">
        <view class="func-item" @click="toUserManage">
          <image src="/static/icons/user-manage.png" class="func-icon"></image>
          <text class="func-text">用户管理</text>
          <image src="/static/icons/arrow-right.png" class="arrow-icon"></image>
        </view>
        <view class="func-item" @click="toSystemLog">
          <image src="/static/icons/log.png" class="func-icon"></image>
          <text class="func-text">系统操作日志</text>
          <image src="/static/icons/arrow-right.png" class="arrow-icon"></image>
        </view>
        <view class="func-item" @click="toSystemSetting">
          <image src="/static/icons/system.png" class="func-icon"></image>
          <text class="func-text">系统设置</text>
          <image src="/static/icons/arrow-right.png" class="arrow-icon"></image>
        </view>
      </view>
    </view>

    <!-- 公共功能区：所有角色都显示 -->
    <view class="common-function">
      <view class="func-item" @click="toSetting">
        <image src="/static/icons/setting.png" class="func-icon"></image>
        <text class="func-text">账号设置</text>
        <image src="/static/icons/arrow-right.png" class="arrow-icon"></image>
      </view>
      <view class="func-item" @click="toFeedback">
        <image src="/static/icons/feedback.png" class="func-icon"></image>
        <text class="func-text">意见反馈</text>
        <image src="/static/icons/arrow-right.png" class="arrow-icon"></image>
      </view>
      <view class="func-item" @click="toAbout">
        <image src="/static/icons/about.png" class="func-icon"></image>
        <text class="func-text">关于我们</text>
        <image src="/static/icons/arrow-right.png" class="arrow-icon"></image>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <button class="logout-btn" @click="logout">退出登录</button>
  </view>
</template>

<script>
  export default {
    name: "Profile",
    data() {
      return {
        // 当前角色（核心）：student/consultant/admin
        currentRole: "student",
        // 角色文本展示
        currentRoleText: "学生",
        // 用户信息（按角色差异化存储，实际项目中替换为接口返回数据）
        userInfo: {
          avatar: "/static/avatar/default.png", // 默认头像
          nickname: "未命名用户",
          // 学生专属字段
          studentId: "",
          grade: "",
          major: "",
          consultCount: 0,
          lastConsultTime: "",
          // 咨询师专属字段
          consultantId: "",
          specialty: "",
          serviceCount: 0,
          pendingAppointment: 0,
          // 管理员专属字段
          adminAccount: "",
          permissionGroup: "",
          totalUserCount: 0,
          pendingAuditCount: 0,
        },
      };
    },
    computed: {
      // 角色标签样式（不同角色不同颜色）
      roleLabelClass() {
        switch (this.currentRole) {
          case "student":
            return "student-label";
          case "consultant":
            return "consultant-label";
          case "admin":
            return "admin-label";
          default:
            return "";
        }
      },
    },
    onLoad(options) {
      console.log('个人页面加载，参数:', options)
      this.loadUserInfo()
    },

    onShow() {
      // 页面显示时重新加载用户信息
      this.loadUserInfo()
    },

    methods: {
      // 加载用户信息
      loadUserInfo() {
        try {
          // 从存储获取用户信息
          const storedUserInfo = uni.getStorageSync('userInfo')
          console.log('从存储获取的用户信息:', JSON.stringify(storedUserInfo, null, 2))

          if (storedUserInfo) {
            // 【关键修复】按优先级获取角色
            let role = this.getUserRole(storedUserInfo)
            this.currentRole = role
            console.log('当前角色:', this.currentRole)

            // 更新角色文本
            this.updateRoleText()

            // 加载对应用户信息
            this.loadUserInfoByRole(storedUserInfo)
          } else {
            // 如果没有用户信息，跳转到登录页
            console.log('未找到用户信息，跳转到登录页')
            uni.reLaunch({
              url: "/pages/login/login"
            })
          }
        } catch (e) {
          console.error('加载用户信息失败:', e)
          this.currentRole = 'student'
          this.updateRoleText()
        }
      },

      // 获取用户角色（优先级顺序）
      getUserRole(userInfo) {
        if (!userInfo) return 'student'

        let role = null

        // 优先级 1: 后端返回的loginRole
        if (userInfo.loginRole) {
          role = userInfo.loginRole
          console.log('使用loginRole:', role)
        }
        // 优先级 2: 前端确定的determinedRole
        else if (userInfo.determinedRole) {
          role = userInfo.determinedRole
          console.log('使用determinedRole:', role)
        }
        // 优先级 3: 用户对象中的role（数据库角色）
        else if (userInfo.user && userInfo.user.role) {
          role = userInfo.user.role
          console.log('使用user.role:', role)
        }
        // 默认值
        else {
          role = 'student'
          console.log('使用默认角色: student')
        }

        // 标准化角色值
        return this.normalizeRole(role)
      },

      // 标准化角色值
      normalizeRole(role) {
        if (!role) return 'student'

        const roleMap = {
          'student': 'student',
          'consultant': 'consultant',
          'admin': 'admin',
          'STUDENT': 'student',
          'CONSULTANT': 'consultant',
          'ADMIN': 'admin'
        }

        return roleMap[role] || 'student'
      },

      // 更新角色展示文本
      updateRoleText() {
        switch (this.currentRole) {
          case "student":
            this.currentRoleText = "学生";
            break;
          case "consultant":
            this.currentRoleText = "心理咨询师";
            break;
          case "admin":
            this.currentRoleText = "系统管理员";
            break;
          default:
            this.currentRoleText = "未知角色";
        }
      },

      // 按角色加载用户信息
      loadUserInfoByRole(storedUserInfo) {
        console.log('按角色加载用户信息，角色为:', this.currentRole)

        // 如果有存储的用户信息，使用存储的信息
        if (storedUserInfo && storedUserInfo.user) {
          const userData = storedUserInfo.user
          this.userInfo.avatar = userData.avatarUrl || "/static/avatar/default.png"
          this.userInfo.nickname = userData.username || userData.realName || "未命名用户"

          // 根据角色设置额外信息
          switch (this.currentRole) {
            case "student":
              this.userInfo.studentId = userData.studentId || "2025001001"
              this.userInfo.grade = userData.grade || "2025级"
              this.userInfo.major = userData.major || "计算机科学与技术"
              this.userInfo.consultCount = userData.consultCount || 3
              this.userInfo.lastConsultTime = userData.lastConsultTime || "2025-12-05 15:30"
              break
            case "consultant":
              this.userInfo.consultantId = userData.consultantId || "C2025001"
              this.userInfo.specialty = userData.specialty || "情绪疏导、压力管理"
              this.userInfo.serviceCount = userData.serviceCount || 128
              this.userInfo.pendingAppointment = userData.pendingAppointment || 2
              break
            case "admin":
              this.userInfo.adminAccount = userData.adminAccount || "admin2025"
              this.userInfo.permissionGroup = userData.permissionGroup || "超级管理员"
              this.userInfo.totalUserCount = userData.totalUserCount || 256
              this.userInfo.pendingAuditCount = userData.pendingAuditCount || 1
              break
          }
        } else {
          // 模拟不同角色的默认数据
          switch (this.currentRole) {
            case "student":
              this.userInfo = {
                ...this.userInfo,
                nickname: "小明同学",
                studentId: "2025001001",
                grade: "2025级",
                major: "计算机科学与技术",
                consultCount: 3,
                lastConsultTime: "2025-12-05 15:30",
              };
              break;
            case "consultant":
              this.userInfo = {
                ...this.userInfo,
                nickname: "张心理咨询师",
                consultantId: "C2025001",
                specialty: "情绪疏导、压力管理",
                serviceCount: 128,
                pendingAppointment: 2,
              };
              break;
            case "admin":
              this.userInfo = {
                ...this.userInfo,
                nickname: "系统管理员",
                adminAccount: "admin2025",
                permissionGroup: "超级管理员",
                totalUserCount: 256,
                pendingAuditCount: 1,
              };
              break;
          }
        }

        console.log('加载后的用户信息:', this.userInfo)
      },

      // ========== 学生专属方法 ==========
      toMyAppointment() {
        uni.navigateTo({
          url: "/pages/student/my-appointment/my-appointment"
        });
      },
      toMyTest() {
        uni.navigateTo({
          url: "/pages/student/my-test/my-test"
        });
      },
      toEditStudentInfo() {
        uni.navigateTo({
          url: "/pages/student/edit-info/edit-info"
        });
      },

      // ========== 咨询师专属方法 ==========
      toMySchedule() {
        uni.navigateTo({
          url: "/pages/consultant/my-schedule/my-schedule"
        });
      },
      toMyStudents() {
        uni.navigateTo({
          url: "/pages/consultant/my-students/my-students"
        });
      },
      toConsultRecord() {
        uni.navigateTo({
          url: "/pages/consultant/consult-record/consult-record"
        });
      },

      // ========== 管理员专属方法 ==========
      toUserManage() {
        uni.navigateTo({
          url: "/pages/admin/user-manage/user-manage"
        });
      },
      toSystemLog() {
        uni.navigateTo({
          url: "/pages/admin/system-log/system-log"
        });
      },
      toSystemSetting() {
        uni.navigateTo({
          url: "/pages/admin/system-setting/system-setting"
        });
      },

      // ========== 公共方法 ==========
      toSetting() {
        uni.navigateTo({
          url: "/pages/common/setting/setting"
        });
      },
      toFeedback() {
        uni.navigateTo({
          url: "/pages/common/feedback/feedback"
        });
      },
      toAbout() {
        uni.navigateTo({
          url: "/pages/common/about/about"
        });
      },

      // 退出登录
      logout() {
        uni.showModal({
          title: "确认退出",
          content: "是否确认退出当前账号？",
          success: (res) => {
            if (res.confirm) {
              // 清除缓存
              uni.clearStorageSync('userInfo')
              uni.clearStorageSync('userRole')
              // 跳转到登录页
              uni.reLaunch({
                url: "/pages/login/login"
              });
            }
          },
        });
      },
    },
  };
</script>

<style scoped>
  /* 全局容器 */
  .profile-container {
    width: 100%;
    min-height: 100vh;
    background-color: #f5f7fa;
    padding-bottom: 40rpx;
  }

  /* 头部：头像+昵称+角色 */
  .profile-header {
    display: flex;
    align-items: center;
    padding: 40rpx 30rpx;
    background-color: #fff;
    margin-bottom: 20rpx;
  }

  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    margin-right: 30rpx;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .nickname {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 10rpx;
  }

  .role-label {
    font-size: 24rpx;
    padding: 6rpx 16rpx;
    border-radius: 20rpx;
    color: #fff;
  }

  .student-label {
    background-color: #409eff;
    /* 学生：蓝色 */
  }

  .consultant-label {
    background-color: #67c23a;
    /* 咨询师：绿色 */
  }

  .admin-label {
    background-color: #e6a23c;
    /* 管理员：橙色 */
  }

  /* 角色专属卡片 */
  .role-card {
    background-color: #fff;
    margin: 0 20rpx 20rpx;
    border-radius: 12rpx;
    padding: 30rpx;
  }

  .card-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 20rpx;
    padding-bottom: 10rpx;
    border-bottom: 1px solid #eee;
  }

  .info-item {
    display: flex;
    align-items: center;
    padding: 15rpx 0;
    border-bottom: 1px solid #f5f5f5;
  }

  .info-label {
    font-size: 28rpx;
    color: #666;
    width: 180rpx;
  }

  .info-value {
    font-size: 28rpx;
    color: #333;
    flex: 1;
  }

  .red-text {
    color: #f56c6c;
    font-weight: 600;
  }

  /* 功能列表通用样式 */
  .function-list,
  .common-function {
    background-color: #fff;
    margin: 0 20rpx 20rpx;
    border-radius: 12rpx;
  }

  .func-item {
    display: flex;
    align-items: center;
    padding: 25rpx 30rpx;
    border-bottom: 1px solid #f5f5f5;
  }

  .func-item:last-child {
    border-bottom: none;
  }

  .func-icon {
    width: 40rpx;
    height: 40rpx;
    margin-right: 20rpx;
  }

  .func-text {
    font-size: 28rpx;
    color: #333;
    flex: 1;
  }

  .arrow-icon {
    width: 24rpx;
    height: 24rpx;
    color: #ccc;
  }

  /* 退出登录按钮 */
  .logout-btn {
    width: calc(100% - 40rpx);
    margin: 0 auto;
    background-color: #f56c6c;
    color: #fff;
    border: none;
    border-radius: 8rpx;
    padding: 20rpx 0;
    font-size: 30rpx;
  }
</style>