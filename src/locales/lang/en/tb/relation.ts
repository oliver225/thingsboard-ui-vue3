export default {
  title: 'Relation',
  direction: {
    outgoing: 'Outgoing (From)',
    incoming: 'Incoming (To)',
  },
  table: {
    type: 'Type',
    toEntityType: 'To Entity Type',
    toEntityName: 'To Entity Name',
    fromEntityType: 'From Entity Type',
    fromEntityName: 'From Entity Name',
    description: 'Description',
  },
  common: {
    from: 'From',
    current: 'Current',
  },
  action: {
    add: 'Add Relation',
    edit: 'Edit Relation',
    delete: 'Delete Relation',
    deleteSuccess: 'Delete relation success!',
    addSuccess: 'Add relation success!',
    editSuccess: 'Edit relation success!',
  },
  confirm: {
    deleteTitle: 'Are you sure to remove relation from entity [{name}]?',
    deleteContent: "After confirmation, the current entity will remove relation with entity '{name}'",
    deleteOk: 'Delete',
  },
  form: {
    relationType: 'Relation Type',
    relationTypePlaceholder: 'Please enter relation type',
    fromEntity: 'From Entity',
    toEntity: 'To Entity',
    additionalInfo: 'Additional Info',
    additionalInfoJsonError: 'Additional info format error! Please enter JSON data',
  },
};
