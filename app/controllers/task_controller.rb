class TaskController < ApplicationController

  before_filter :authenticate!

  def list
    tasks = Task.find(:all)
    res = []
    tasks.each do |task|
      res << {
        'id' => task.id,
        'owner' => task.owner.name,
        'title' => task.title,
        'priority' => task.priority,
        'created_at' => task.created_at,
        'status' => task.status,
        'tags' => task.tags.map{|t| t.name},
      }
    end
    render :json => res.to_json
  end

  def detail
    task = Task.find(params[:id])
    res = {
      'id' => task.id,
      'owner' => task.owner.name,
      'title' => task.title,
      'priority' => task.priority,
      'created' => task.created_at,
      'status' => task.status,
      'tags' => task.tags.map{|t| t.name},
      'notes' => task.notes.map{|note|
        { 'id' => note.id,
          'description' => note.description,
          'author' => note.user.name,
          'created_at' => note.created_at
        }
      },
    }
    render :json => res
  end

end
