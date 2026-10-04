#!/usr/bin/env perl
# Minimal static file server (core modules only) for local preview.
# Usage: perl tools/serve.pl [root_dir] [port]
use strict;
use warnings;
use IO::Socket::INET;
use Cwd qw(abs_path);

my $root = abs_path($ARGV[0] // '.');
$root =~ s{\\}{/}g;
my $port = $ARGV[1] // 8080;

my %types = (
  html => 'text/html; charset=utf-8',
  css  => 'text/css; charset=utf-8',
  js   => 'application/javascript; charset=utf-8',
  json => 'application/json; charset=utf-8',
  svg  => 'image/svg+xml',
  png  => 'image/png',
  jpg  => 'image/jpeg',
  ico  => 'image/x-icon',
  txt  => 'text/plain; charset=utf-8',
);

my $srv = IO::Socket::INET->new(
  LocalAddr => "127.0.0.1",
  LocalPort => $port,
  Listen    => 20,
  ReuseAddr => 1,
) or die "listen failed: $!";

print "serving $root on http://127.0.0.1:$port/\n";

sub respond {
  my ($c, $code, $type, $body) = @_;
  my %reason = (200 => 'OK', 404 => 'Not Found', 400 => 'Bad Request');
  print $c "HTTP/1.1 $code $reason{$code}\r\n",
           "Content-Type: $type\r\n",
           "Content-Length: " . length($body) . "\r\n",
           "Connection: close\r\n\r\n$body";
}

while (my $c = $srv->accept()) {
  $c->autoflush(1);
  my $req = <$c> // '';
  my (undef, $path) = $req =~ /^(\S+)\s+(\S+)/;
  $path = '/index.html' unless defined $path && $path ne '';
  $path =~ s/\?.*//;
  $path =~ s{^/+}{};

  if ($path =~ /\.\./ || $path =~ m{^[A-Za-z]:}) {
    respond($c, 400, 'text/plain', 'bad request');
    close $c;
    next;
  }
  $path = 'index.html' if $path eq '';

  my $file = "$root/$path";
  $file =~ s{\\}{/}g;
  if (index($file, $root) != 0 || !-f $file) {
    respond($c, 404, 'text/plain', 'not found');
    close $c;
    next;
  }

  open my $fh, '<:raw', $file or do {
    respond($c, 404, 'text/plain', 'not found');
    close $c;
    next;
  };
  local $/;
  my $body = <$fh>;
  close $fh;

  (my $ext = $file) =~ s/.*\.//;
  my $type = $types{lc $ext} // 'application/octet-stream';
  respond($c, 200, $type, $body);
  close $c;
}
