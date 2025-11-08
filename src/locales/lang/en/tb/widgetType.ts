export default {
  title: 'Widget',
  table: {
    title: 'Title',
    type: 'Widget Type',
    system: 'System',
    deprecated: 'Deprecated',
    createdTime: 'Created Time',
  },
  action: {
    add: 'Add Widget',
    export: 'Export Widgets Bundle',
    delete: 'Delete Widgets Bundle',
    deleteConfirm: 'Are you sure to delete widget [{name}]?',
    deleteConfirmContent:
      'Please note that after confirmation, the widget and all related data will not be recoverable.',
    deleteText: 'Delete',
    deleteSuccess: 'Delete widget success!',
  },
  widgetType: {
    timeSeries: 'Time Series',
    latest: 'Latest Data',
    rpc: 'RPC Widget',
    static: 'Static Widget',
    alarm: 'Alarm Widget',
  },
};
