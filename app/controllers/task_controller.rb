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
    render :json => task.vob_hash.to_json
  end

  def update
    task = Task.find(params[:id])
    changed = []
    if params[:title].to_s.strip.present? && params[:title].strip != task.title
      changed << "Title changed from '#{task.title}' to '#{params[:title]}'."
      task.title = params[:title].strip
    end
    if params[:owner].present? && task.owner.name != params[:owner]
      user = User.find_by_name(params[:owner])
      raise ActiveRecord::RecordNotFound unless user
      changed << "Owner changed from '#{task.owner.name}' to '#{params[:owner]}'."
      task.owner = user
    end
    if params[:status].present? && task.status != params[:status]
      if Task::STATUSES.include? params[:status]
        changed << "Status changed from '#{task.status}' to '#{params[:status]}'."
        task.status = params[:status]
      end
    end
    if (params[:priority] =~ /-?\d+/) && task.priority != params[:priority].to_i
      changed << "Priority changed from '#{task.priority}' to '#{params[:priority]}'."
      task.priority = params[:priority]
    end
    if params[:note].present?
      note = Note.new
      note.task = task
      note.user = current_user
      note.description = params[:note]
      note.save
    end
    if changed.present?
      task.save
      note = Note.new
      note.task = task
      note.user = current_user
      note.description = changed.join("\n")
      note.save
    end
    render :json => task.vob_hash(true).to_json
  end

end
