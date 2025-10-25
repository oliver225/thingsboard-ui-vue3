export default {
  title: '用戶',
  table: {
    email: '電子郵件',
    firstName: '名字',
    lastName: '職務',
    phone: '手機號碼',
    description: '描述資訊',
    createdTime: '創建時間',
  },
  form: {
    email: '電子郵件',
    firstName: '名字',
    lastName: '職務',
    phone: '手機號碼',
    description: '描述資訊',
    activationMethod: '啟用方式',
    defaultDashboard: '預設面板',
    homeDashboard: '主儀表板',
    defaultDashboardFullscreen: '始終全螢幕',
    homeDashboardHideToolbar: '隱藏主儀表板工具欄',
    lang: '語言',
    unitSystem: '單位制',
    status: '用戶狀態',
    emailRequired: '電子郵件必須輸入',
    emailRule: '請填寫正確的電子郵件地址',
    phoneRequired: '手機號碼必須輸入',
    phoneRule: '請填寫正確的手機號碼',
    activationShowLink: '顯示啟動連結',
  },
  action: {
    add: '新增用戶',
    edit: '編輯用戶',
    delete: '刪除用戶',
    disableAccount: '停用帳戶',
    enableAccount: '啟用帳戶',
    loginAsUser: '以用戶身份登入',
    showActivationLink: '顯示啟用連結',

    copyUserId: '複製用戶ID',

    customerEmpty: '客戶為空！',

    deleteConfirm: '確定刪除用戶[{name}]嗎？',
    deleteConfirmContent: '確認後，用戶和所有相關數據將不可恢復。',

    addSuccess: '新增用戶成功！',
    editSuccess: '編輯用戶成功！',
    deleteSuccess: '刪除用戶成功！',
    copyUserIdSuccess: '複製用戶ID成功！',
    copyActivationLinkSuccess: '複製用戶啟用連結成功！',

    activationLink: '用戶啟用連結',

    disableAccountConfirm: '確定停用用戶[{name}]嗎？',
    disableAccountConfirmContent: '停用後，用戶帳戶將不可用。',
    disableAccountSuccess: '停用用戶帳戶成功！',
    enableAccountSuccess: '啟用用戶帳戶成功！',

    resendActivationMail: '重新發送啟用郵件',
    sendActivationMailSuccess: '啟用電子郵件已成功發送！',
  },
  detail: {
    detail: '用戶詳情',
    activated: '已激活',
    notActivated: '未激活',
    accountDisabled: '帳戶已禁用',
  },
  admin: {
    title: '租戶管理員',
    action: {
      add: '新增管理員',
      edit: '編輯管理員',
      delete: '刪除管理員',
      copyUserId: '複製管理員ID',
      loginAsAdmin: '以管理員身份登入',
      deleteConfirm: '確定刪除管理員[{name}]嗎？',
      deleteConfirmContent: '確認後，管理員和所有相關數據將不可恢復。',
      addSuccess: '新增租戶管理員成功！',
      editSuccess: '編輯租戶管理員成功！',
      deleteSuccess: '刪除租戶管理員成功！',

      tenantEmpty: '租戶為空！',
    },
    detail: {
      title: '租戶管理員詳情',
    },
  },
};
