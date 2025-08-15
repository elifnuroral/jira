/*export enum TaskAction {
  CREATED = 0, // "Task Created"
  STARTED = 1, // "Task Started"
  IN_PROGRESS = 2, // "Task In Progress"
  COMPLETED = 3, // "Task Completed"
  CLOSED = 4, // "Task Closed"
  DELETED = 5, // "Task Deleted"
  ASSIGNED = 6, // "Task Assigned"
  PRIORITY_CHANGED = 7, // "Task Priority Changed"
}
*/
export enum TaskAction {
  CREATED = 'CREATED', // "Task Created"
  UPDATE = 'UPDATE',
  DELETED = 'DELETED', // "Task Deleted"
  STATUS_CHANGED = 'STATUS_CHANGED', // "Task STATUS CAHNEGED
  IN_PROGRESS = 'IN_PROGRESS', //Eğer taskin statusü IN_PROGRESS ise action IN_PROGRESS OLARAK KAYDEDİLECEK.
  COMMENT_DELETED = 'COMMENT_DELETED', //taske ait bir torum silindiğinde
}
