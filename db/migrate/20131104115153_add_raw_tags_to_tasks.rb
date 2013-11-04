class AddRawTagsToTasks < ActiveRecord::Migration
  def change
    add_column :tasks, :raw_tags, :string
  end
end
