var app = getApp();

Page({
  data: {
    studentId: '',
    vpnPassWord: '',
    jwcPassWord: '',
    studentIdFocus: false,
    vpnPassWordFocus: false,
    jwcPassWordFocus: false,
    vpnPassWordErr: true,
    jwcPassWordErr: true,
    step: 1,
    help: {
      helpStatus: false,
      faqList: [
        {
          question: '1.校外访问VPN密码是什么?',
          answer: '初始密码或者已更改的密码。初始密码一般为身份证号后6位。'
        },
        {
          question: '2.教务处密码是什么?',
          answer: '初始密码或者已更改的密码。初始密码为学号/一卡通号。'
        },
        {
          question: '3.忘记密码?',
          answer: '请联系学校教务处管理员。'
        }
      ]
    }
  },

  onLoad: function() {
    if (app.store.bind === true) {
      this.setData({
        step: 3
      });
    } else {
      this.setData({
        step: 1
      });
    }
  },

  // 获取焦点
  inputFocus: function(e) {
    if (e.target.id === 'studentId') {
      this.setData({
        studentIdFocus: true
      });
    } else if (e.target.id === 'vpnPassWord') {
      this.setData({
        vpnPassWordFocus: true
      });
      this.setData({
        vpnPassWordErr: true
      });
    } else if (e.target.id === 'jwcPassWord') {
      this.setData({
        jwcPassWordFocus: true
      });
      this.setData({
        jwcPassWordErr: true
      });
    }
  },

  // 失去焦点
  inputBlur: function(e) {
    if (e.target.id === 'studentId') {
      this.setData({
        studentIdFocus: false
      });
    } else if (e.target.id === 'vpnPassWord') {
      this.setData({
        vpnPassWordFocus: false
      });
    } else if (e.target.id === 'jwcPassWord') {
      this.setData({
        jwcPassWordFocus: false
      });
    }
  },

  // 双向绑定
  keyInput: function(e) {
    var id = e.target.id;

    if (id === 'studentId') {
      this.setData({
        studentId: e.detail.value
      });
    } else if (id === 'vpnPassWord') {
      this.setData({
        vpnPassWord: e.detail.value
      });
    } else if (id === 'jwcPassWord') {
      this.setData({
        jwcPassWord: e.detail.value
      });
    }
  },

  // 下一步
  navigateNext: function() {
    var studentId = this.data.studentId;

    if (!studentId || studentId.length < 12) {
      wx.showToast({
        title: '请正确填写学号',
        image: '/images/fail.png',
        duration: 2000
      });
    } else {
      this.setData({
        step: 2
      });
    }
  },

  // 取消认证
  navigateCancel: function() {
    wx.navigateBack();
  },

  // 扫码获取学号
  scanStudentId: function() {
    wx.showModal({
      title: '提示',
      content: '请将一卡通背面的条形码放入框内，即可自动扫描。',
      showCancel: false,
      success: operation => {
        if (operation.confirm) {
          wx.scanCode({
            onlyFromCamera: true,
            success: scanRes => {
              this.setData({
                studentId: scanRes.result
              });
            }
          });
        }
      }
    });
  },

  // 上一步
  navigatePre: function() {
    this.setData({
      step: 1
    });
  },

  // 认证并绑定
  bind: function() {
    var studentId = this.data.studentId;
    var vpnPassWord = this.data.vpnPassWord;
    var jwcPassWord = this.data.jwcPassWord;

    if (!vpnPassWord || !jwcPassWord) {
      wx.showToast({
        title: '请正确填写密码',
        image: '/images/fail.png',
        duration: 2000
      });
    } else {
      // 加载中
      wx.showLoading({
        title: '认证中',
        mask: true
      });

      // 发起网络请求
      wx.request({
        url: app.api + '/users/binding',
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded',
          Authorization: 'Bearer ' + app.store.token
        },
        data: {
          studentId: studentId,
          vpnPassWord: vpnPassWord,
          jwcPassWord: jwcPassWord
        },
        success: bindingState => {
          var bindingState = bindingState.data;
          console.log(bindingState);

          wx.hideLoading();

          if (
            bindingState.statusCode === 201 ||
            bindingState.statusCode === 200
          ) {
            // 更新store和storage
            app.store.bind = true;
            wx.setStorage({
              key: bind,
              data: true
            });

            wx.showToast({
              title: '绑定成功',
              icon: 'success',
              duration: 2000
            });
            this.setData({
              step: 3
            });
            setTimeout(() => {
              wx.redirectTo({
                url: 'more'
              });
            }, 1000);
          } else if (bindingState.statusCode === 400) {
            wx.showToast({
              title: '密码输入有误',
              icon: '/images/fail.png',
              duration: 2000
            });

            // 密码错误提示
            this.setData({
              vpnPassWordErr: bindingState.data.vpn
            });
            this.setData({
              jwcPassWordErr: bindingState.data.jwc
            });
          } else {
            wx.showToast({
              title: '服务器繁忙',
              icon: '/images/fail.png',
              duration: 2000
            });
          }
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({
            title: '服务器繁忙',
            icon: '/images/fail.png',
            duration: 2000
          });
        }
      });
    }
  },

  // 解除绑定
  rebind: function() {
    wx.showModal({
      title: '提示',
      content: '确定要重新绑定吗?',
      success: operation => {
        if (operation.confirm) {
          // 修改bind
          app.store.bind = false;
          this.setData({
            step: 1
          });
        }
      }
    });
  },

  // 帮助
  showHelp: function() {
    this.setData({
      'help.helpStatus': true
    });
  },
  hideHelp: function(e) {
    if (e.target.id === 'help' || e.target.id === 'close-help') {
      this.setData({
        'help.helpStatus': false
      });
    }
  }
});
