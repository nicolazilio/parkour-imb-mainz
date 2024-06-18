def get_client_ip(request):
    # Stolen from https://stackoverflow.com/questions/4581789/how-do-i-get-user-ip-address-in-django
    # and amended
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    ip = 'N/A'
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        remote_address = request.META.get('REMOTE_ADDR')
        if remote_address:
            ip = remote_address
    return ip