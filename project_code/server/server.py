from ghost import Ghost
ghost = Ghost()
page, extra_resources = ghost.open("http://marcinignac.com")
#assert page.http_status==200 and 'jeanphix' in ghost.content

print('\n')

for property, value in vars(extra_resources[1]._reply).iteritems():
    print property, ": ", value

print('\n')

for request in extra_resources:
  print(request.url)