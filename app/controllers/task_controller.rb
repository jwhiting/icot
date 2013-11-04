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
    render :json => task.vob_hash(:notes => true).to_json
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

    Task.transaction do
      new_names = params[:raw_tags].to_s.split(/\s+/).uniq
      cur_names = task.tags.map{|t| t.name}
      new_names.each do |name|
        if cur_names.include? name.downcase
          # as-is
        else
          # add
          t = Tag.new
          t.name = name
          task.tags << t
          changed << "Added tag '#{name}'"
        end
      end
      cur_names.each do |name|
        if new_names.include? name.downcase
          # as-is
        else
          # remove
          delete_tags = []
          task.tags.each do |tag|
            if tag.name == name
              delete_tags << tag
            end
          end
          delete_tags.each do |tag|
            tag.destroy
          end
          changed << "Removed tag '#{name}'"
        end
      end
      task.raw_tags = new_names.join(" ")

      if task.valid?
        task.save
        if params[:note].present?
          note = Note.new
          note.task = task
          note.user = current_user
          note.description = params[:note]
          note.save
        end
        if changed.present?
          note = Note.new
          note.task = task
          note.user = current_user
          note.description = changed.join("\n")
          note.save
        end
        render :json => {:success => true, :task => task.vob_hash(:reload => true, :notes => true)}
        return
      else
        raise ActiveRecord::Rollback
      end
    end
    render :json => {:success => false, :errors => task.errors.map{|prop,msg| "#{prop}: #{msg}"}}
  end

  def create
    Task.transaction do
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
      if params[:raw_tags].present?
        new_tags = params[:raw_tags].to_s.strip.split(/\s+/)
        new_tags.each do |new_tag|
          tag = Tag.new
          tag.name = new_tag
          task.tags << tag
        end
      end
      if params[:note].present?
        note = Note.new
        note.user = current_user
        note.description = params[:note].to_s.strip
        task.notes << note
      end
      if task.valid?
        task.save # also saves new notes and tags
        render :json => {:success => true, :task => task.vob_hash(:reload => true, :notes => true)}
      else
        render :json => {:success => false, :errors => task.errors.map{|prop,msg| "#{prop}: #{msg}"}}
      end
    end
  end

end
