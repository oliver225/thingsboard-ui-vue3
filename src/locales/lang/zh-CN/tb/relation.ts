export default {
  title: '关联',
  direction: {
    outgoing: '向外(From)',
    incoming: '向内(To)',
  },
  table: {
    type: '类型',
    toEntityType: '到实体类型',
    toEntityName: '到实体名称',
    fromEntityType: '从实体类型',
    fromEntityName: '从实体名称',
    description: '描述',
  },
  common: {
    from: '从',
    current: '当前',
  },
  action: {
    add: '新增关联',
    edit: '编辑关联',
    delete: '删除关联',
    deleteSuccess: '删除关联成功！',
    addSuccess: '新增关联成功！',
    editSuccess: '编辑关联成功！',
  },
  confirm: {
    deleteTitle: '确定从实体[{name}]删除关联吗？',
    deleteContent: "确定删除后，当前实体将与实体 '{name}' 取消关联",
    deleteOk: '删除',
  },
  form: {
    relationType: '关联类型',
    relationTypePlaceholder: '请输入关联类型',
    fromEntity: '从实体',
    toEntity: '到实体',
    additionalInfo: '附加信息',
    additionalInfoJsonError: '附加信息格式错误！请输入JSON格式数据',
  },
};
