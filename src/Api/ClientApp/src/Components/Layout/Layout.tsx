import UserProfileMenu from '@components/UserProfileMenu';
import useCustomLayout from '@context/LayoutProvider';
import useAuth from '@hooks/useAuth';
import {
  AppShell,
  Box,
  Burger,
  Container,
  Group,
  Header,
  MediaQuery,
  NavLink,
  Navbar,
  ScrollArea,
  ThemeIcon,
  createStyles,
  rem,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconInfoSquare } from '@tabler/icons';
import { UserRole } from '@utils/enums';
import { useGeneralSetting } from '@utils/services/adminService';
import { IUser } from '@utils/services/types';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';
import { AppFooter } from './AppFooter';
import { LeftMainLinks } from './LeftMainLink';

const HEADER_HEIGHT = 60;
const useStyles = createStyles((theme) => ({
  header: {
    backgroundColor: theme.fn.variant({
      variant: 'filled',
      color: theme.primaryColor,
    }).background,
    borderBottom: 0,
  },

  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  burger: {
    [theme.fn.largerThan('sm')]: {
      display: 'none',
    },
  },

  links: {
    paddingTop: theme.spacing.lg,
    height: HEADER_HEIGHT,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',

    [theme.fn.smallerThan('sm')]: {
      display: 'none',
    },
  },

  mainLinks: {
    marginRight: -theme.spacing.sm,
  },

  mainLink: {
    textTransform: 'uppercase',
    fontSize: 13,
    color: theme.white,
    padding: `7px ${theme.spacing.sm}px`,
    fontWeight: 700,
    borderBottom: '2px solid transparent',
    transition: 'border-color 100ms ease, opacity 100ms ease',
    opacity: 0.9,
    borderTopRightRadius: theme.radius.sm,
    borderTopLeftRadius: theme.radius.sm,

    '&:hover': {
      opacity: 1,
      textDecoration: 'none',
    },
  },

  secondaryLink: {
    color: theme.colors[theme.primaryColor][0],
    fontSize: theme.fontSizes.xs,
    textTransform: 'uppercase',
    transition: 'color 100ms ease',

    '&:hover': {
      color: theme.white,
      textDecoration: 'none',
    },
  },

  mainLinkActive: {
    color: theme.white,
    opacity: 1,
    borderBottomColor:
      theme.colorScheme === 'dark'
        ? theme.white
        : theme.colors[theme.primaryColor][5],
    backgroundColor: theme.fn.lighten(
      theme.fn.variant({ variant: 'filled', color: theme.primaryColor })
        .background!,
      0.1
    ),
  },
  footer: {
    paddingTop: theme.spacing.xs,
    marginTop: theme.spacing.md,
    borderTop: `${rem(0.2)} solid `,
  },
}));

const Layout = ({ showNavBar = true }: { showNavBar?: boolean }) => {
  const settings = useGeneralSetting();

  const setHeader = () => {
    const info =
      localStorage.getItem('app-info') &&
      JSON.parse(localStorage.getItem('app-info') ?? '');
    if (info) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      document.title = info.name;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(info.logo);
      }
      link.href = info.logo;
    }
  };

  useEffect(() => {
    setHeader();

    if (settings.isSuccess) {
      localStorage.setItem(
        'app-info',
        JSON.stringify({
          name: settings.data.data.companyName,
          logo: settings.data.data.logoUrl,
        })
      );
      setHeader();
    }
  }, [settings.isSuccess]);

  const auth = useAuth();

  const [opened, { toggle }] = useDisclosure(false);
  const { classes, theme } = useStyles();
  const footerMenu = {
    icon: <IconInfoSquare size={16} />,
    color: 'blue',
    label: 'help',
    href: 'https://docs.google.com/document/d/1S_wlCY7XH2oELa8ZvNPSGVik2117HuclOGC04iHpP-w/edit#heading=h.yf9se9jmezfr',
    replace: true,
    role: UserRole.Trainee,
    target: '_blank',
  };
  const layout = useCustomLayout();
  const { t } = useTranslation();
  return (
    <AppShell
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === 'dark'
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      })}
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      navbar={
        layout.meetPage ? (
          <></>
        ) : (!layout.examPage || !layout.meetPage) && showNavBar ? (
          <Navbar
            height={'auto'}
            p="xs"
            hiddenBreakpoint="sm"
            hidden={!opened}
            width={{ sm: 200 }}
          >
            <Navbar.Section grow component={ScrollArea} mx="-xs" px="xs">
              <Box py="sm">
                {!layout.meetPage && <LeftMainLinks onClose={() => toggle()} />}
              </Box>
            </Navbar.Section>
            {!layout.meetPage && (
              <Navbar.Section className={classes.footer}>
                <NavLink
                  component="a"
                  href={footerMenu.href}
                  label={t(`${footerMenu.label}`)}
                  target={footerMenu.target}
                  icon={
                    <ThemeIcon color={footerMenu.color}>
                      {footerMenu.icon}
                    </ThemeIcon>
                  }
                  sx={(theme) => ({
                    padding: theme.spacing.xs,
                    borderRadius: theme.radius.sm,
                  })}
                />
              </Navbar.Section>
            )}
          </Navbar>
        ) : (
          <></>
        )
      }
      header={
        layout.meetPage ? (
          <></>
        ) : layout.examPage ? (
          <Header px={20} height={HEADER_HEIGHT}>
            <Group
              sx={{
                justifyContent: 'space-between',
                width: '100%',
                // height: HEADER_HEIGHT,
                alignItems: 'center',
              }}
            >
              <Box>{layout.examPageTitle}</Box>
              <Box>{layout.examPageAction}</Box>
            </Group>
          </Header>
        ) : (
          <Header height={HEADER_HEIGHT}>
            <Container className={classes.inner} fluid>
              <Group>
                <MediaQuery largerThan="sm" styles={{ display: 'none' }}>
                  <Burger
                    aria-label="Toggle navbar"
                    opened={opened}
                    onClick={() => toggle()}
                    size="sm"
                    color={theme.colors.gray[6]}
                    mr="xl"
                  />
                </MediaQuery>
                <Link to="/">
                  <img height={50} src={settings.data?.data?.logoUrl} alt="" />
                </Link>
              </Group>
              {auth?.auth && (
                <UserProfileMenu
                  user={
                    {
                      email: auth.auth.email,
                      fullName: auth.auth.firstName + ' ' + auth.auth.lastName,
                      id: auth.auth.id,
                      role: auth.auth.role,
                      imageUrl: auth.auth.imageUrl,
                    } as IUser
                  }
                />
              )}
            </Container>
          </Header>
        )
      }
      footer={
        <AppFooter name={settings.data?.data?.companyName ?? ''}></AppFooter>
      }
    >
      <MediaQuery
        smallerThan="sm"
        styles={{ display: opened ? 'none' : 'block' }}
      >
        <Outlet />
      </MediaQuery>
    </AppShell>
  );
};

export default Layout;
