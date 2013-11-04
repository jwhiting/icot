class ApplicationController < ActionController::Base
  protect_from_forgery

  after_filter :set_csrf_cookie_for_ng

  def set_csrf_cookie_for_ng
    cookies['XSRF-TOKEN'] = form_authenticity_token if protect_against_forgery?
  end

  def authenticate!
    if !session[:user_name]
      render :json => {:error => 'authentication required'}
    end
  end

  def current_user
    return nil unless session[:user_name]
    @_current_user ||= User.find_by_name(session[:user_name])
    reset_session if !@_current_user
    @_current_user
  end

  protected

  def verified_request?
    super || form_authenticity_token == request.headers['X-XSRF-TOKEN']
  end

end
