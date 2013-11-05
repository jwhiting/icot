class RenameLongIndices < ActiveRecord::Migration
  def up
    remove_index "tasks", "owner_user_id_and_status_and_created_at"
    remove_index "tasks", "status_and_created_at"
    add_index "tasks", ["owner_user_id", "status", "created_at"], :name => "oid_status_created"
    add_index "tasks", ["status", "created_at"], :name => "status_created"
  end

  def down
    add_index "tasks", ["owner_user_id", "status", "created_at"], :name => "owner_user_id_and_status_and_created_at"
    add_index "tasks", ["status", "created_at"], :name => "status_and_created_at"
    remove_index "tasks", "oid_status_created"
    remove_index "tasks", "status_created"
  end
end
