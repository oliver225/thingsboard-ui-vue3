export default {
  title: '關聯',
  direction: {
    outgoing: '向外(From)',
    incoming: '向內(To)',
  },
  table: {
    type: '類型',
    toEntityType: '到實體類型',
    toEntityName: '到實體名稱',
    fromEntityType: '從實體類型',
    fromEntityName: '從實體名稱',
    description: '描述',
  },
  common: {
    from: '從',
    current: '當前',
  },
  action: {
    add: '新增關聯',
    edit: '編輯關聯',
    delete: '刪除關聯',
    deleteSuccess: '刪除關聯成功！',
    addSuccess: '新增關聯成功！',
    editSuccess: '編輯關聯成功！',
  },
  confirm: {
    deleteTitle: '確定從實體[{name}]刪除關聯嗎？',
    deleteContent: "確定刪除後，當前實體將與實體 '{name}' 取消關聯",
    deleteOk: '刪除',
  },
  form: {
    relationType: '關聯類型',
    relationTypePlaceholder: '請輸入關聯類型',
    fromEntity: '從實體',
    toEntity: '到實體',
    additionalInfo: '附加資訊',
    additionalInfoJsonError: '附加資訊格式錯誤！請輸入 JSON 格式資料',
  },
};
