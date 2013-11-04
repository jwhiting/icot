class CreateBasics < ActiveRecord::Migration
  def up

    create_table :users do |t|
      t.string :name, :null => false
      t.string :encrypted_password
      t.timestamps
    end

    add_index :users, :name

    create_table :tasks do |t|
      t.string :title
      t.string :status
      t.integer :created_by_user_id
      t.integer :owner_user_id
      t.integer :priority
      t.timestamps
    end

    add_index :tasks, [:status, :created_at]
    add_index :tasks, [:owner_user_id, :status, :created_at]

    create_table :notes do |t|
      t.references :task
      t.references :user
      t.string :description
    end

    add_index :notes, :task_id

    create_table :tags do |t|
      t.references :task
      t.string :name
    end

    add_index :tags, :name

  end

  def down
    drop_table :users
    drop_table :tasks
    drop_table :notes
    drop_table :tags
  end

end
