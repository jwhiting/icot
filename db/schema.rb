# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20131105072700) do

  create_table "notes", :force => true do |t|
    t.integer  "task_id"
    t.integer  "user_id"
    t.string   "description"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "notes", ["task_id"], :name => "index_notes_on_task_id"

  create_table "tags", :force => true do |t|
    t.integer "task_id"
    t.string  "name"
  end

  add_index "tags", ["name"], :name => "index_tags_on_name"

  create_table "tasks", :force => true do |t|
    t.string   "title"
    t.string   "status"
    t.integer  "created_by_user_id"
    t.integer  "owner_user_id"
    t.integer  "priority"
    t.datetime "created_at",         :null => false
    t.datetime "updated_at",         :null => false
    t.string   "raw_tags"
    t.integer  "rank"
  end

  add_index "tasks", ["owner_user_id", "status", "created_at"], :name => "index_tasks_on_owner_user_id_and_status_and_created_at"
  add_index "tasks", ["status", "created_at"], :name => "index_tasks_on_status_and_created_at"

  create_table "users", :force => true do |t|
    t.string   "name",               :null => false
    t.string   "encrypted_password"
    t.datetime "created_at",         :null => false
    t.datetime "updated_at",         :null => false
  end

  add_index "users", ["name"], :name => "index_users_on_name"

end
