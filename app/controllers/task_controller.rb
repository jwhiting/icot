class TaskController < ApplicationController

  before_filter :authenticate!

  def list
    tasks = Task.find(:all)
    res = []
    tasks.each do |task|
      res << task.vob_hash
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

    if params[:title].to_s.strip != task.title
      changed << "Title changed from '#{task.title}' to '#{params[:title]}'."
    end
    task.title = params[:title].to_s.strip

    if params[:owner] != 'nobody'
      user = User.find_by_name(params[:owner])
      if !user
        render :json => {:success => false, :errors => ["Owner: not found"]}
        return
      end
      if task.owner != user
        changed << "Owner changed from '#{task.owner.name}' to '#{params[:owner]}'."
      end
      task.owner = user
    else
      if task.owner
        changed << "Owner changed from '#{task.owner.name}' to 'nobody'."
      end
      task.owner = nil
    end

    if task.status != params[:status]
      changed << "Status changed from '#{task.status}' to '#{params[:status]}'."
    end
    task.status = params[:status]

    if task.priority != params[:priority].to_i
      changed << "Priority changed from '#{task.priority}' to '#{params[:priority]}'."
    end
    task.priority = params[:priority]

    if task.valid?
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
      render :json => {:success => true, :task => task.vob_hash(true)}
    else
      render :json => {:success => false, :errors => task.errors.map{|prop,msg| "#{prop}: #{msg}"}}
    end
  end

  def create
    task = Task.new
    task.creator = current_user
    task.title = params[:title].to_s.strip
    if params[:owner] != 'nobody'
      user = User.find_by_name(params[:owner])
      if !user
        render :json => {:success => false, :errors => ["Owner: not found"]}
        return
      end
      task.owner = user
    end
    task.status = params[:status]
    task.priority = params[:priority]
    if params[:note].present?
      note = Note.new
      note.task = task
      note.user = current_user
      note.description = params[:note].to_s.strip
      note.save
    end
    if task.valid?
      task.save
      render :json => {:success => true, :task => task.vob_hash(true)}
    else
      render :json => {:success => false, :errors => task.errors.map{|prop,msg| "#{prop}: #{msg}"}}
    end
  end

end
